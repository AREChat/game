package main

import (
	"encoding/json"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
)

func init() {
	// OS の設定に頼らず、ゲームに必要な種類を はっきり決める（.wasm が違う種類だと 起動しない）
	for ext, t := range map[string]string{
		".wasm":        "application/wasm",
		".webmanifest": "application/manifest+json",
		".js":          "text/javascript; charset=utf-8",
		".mjs":         "text/javascript; charset=utf-8",
		".json":        "application/json; charset=utf-8",
		".html":        "text/html; charset=utf-8",
		".css":         "text/css; charset=utf-8",
		".webp":        "image/webp",
		".svg":         "image/svg+xml",
		".mp3":         "audio/mpeg",
		".ogg":         "audio/ogg",
		".txt":         "text/plain; charset=utf-8",
	} {
		_ = mime.AddExtensionType(ext, t)
	}
}

// NewHandler は root の下のファイルを配る。外へ出る道（..・シンボリックリンク）と 隠しファイル（.git など）は 配らない。
func NewHandler(root string) http.Handler {
	absRoot, err := filepath.Abs(root)
	if err != nil {
		absRoot = root
	}
	if r, e := filepath.EvalSymlinks(absRoot); e == nil {
		absRoot = r
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("Referrer-Policy", "same-origin")
		switch r.Method {
		case http.MethodGet, http.MethodHead:
		case http.MethodOptions:
			h.Set("Allow", "GET, HEAD, OPTIONS")
			w.WriteHeader(http.StatusNoContent)
			return
		default:
			h.Set("Allow", "GET, HEAD, OPTIONS")
			http.Error(w, "405 method not allowed", http.StatusMethodNotAllowed)
			return
		}
		raw := r.URL.Path
		if strings.ContainsRune(raw, 0) || strings.Contains(raw, "\\") {
			http.Error(w, "400 bad path", http.StatusBadRequest)
			return
		}
		if raw == "/__health" {
			n := 0
			if reg, _, e := loadRegistry(absRoot); e == nil {
				n = len(reg.Games)
			}
			h.Set("Content-Type", "application/json; charset=utf-8")
			h.Set("Cache-Control", "no-store")
			_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "games": n})
			return
		}
		clean := path.Clean("/" + raw)
		for _, seg := range strings.Split(clean, "/") {
			if strings.HasPrefix(seg, ".") && seg != "" || seg == "node_modules" {
				notFound(w, r, absRoot)
				return
			}
		}
		full := filepath.Join(absRoot, filepath.FromSlash(clean))
		real, err := filepath.EvalSymlinks(full)
		if err != nil || !within(absRoot, real) {
			notFound(w, r, absRoot)
			return
		}
		st, err := os.Stat(real)
		if err != nil {
			notFound(w, r, absRoot)
			return
		}
		if st.IsDir() {
			if !strings.HasSuffix(raw, "/") {
				u := clean + "/"
				if r.URL.RawQuery != "" {
					u += "?" + r.URL.RawQuery
				}
				http.Redirect(w, r, u, http.StatusMovedPermanently)
				return
			}
			idx := filepath.Join(real, "index.html")
			ist, e := os.Stat(idx)
			if e != nil || ist.IsDir() {
				notFound(w, r, absRoot)
				return
			}
			real, st = idx, ist
		}
		f, err := os.Open(real)
		if err != nil {
			notFound(w, r, absRoot)
			return
		}
		defer f.Close()
		ext := strings.ToLower(filepath.Ext(real))
		if ct := mime.TypeByExtension(ext); ct != "" {
			h.Set("Content-Type", ct)
		}
		etag := `"` + strconv.FormatInt(st.Size(), 16) + "-" + strconv.FormatInt(st.ModTime().UnixNano(), 16) + `"`
		h.Set("ETag", etag)
		switch ext {
		case ".html", ".js", ".css", ".json", ".webmanifest", ".wasm":
			h.Set("Cache-Control", "no-cache") // いつも 確かめる（ETag が同じなら 304 で軽い）
		default:
			h.Set("Cache-Control", "public, max-age=3600")
		}
		if inm := r.Header.Get("If-None-Match"); inm != "" && inm == etag && r.Header.Get("Range") == "" {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		http.ServeContent(w, r, real, st.ModTime(), f) // Range（音楽の頭出し）・If-Modified-Since・HEAD も ここで
	})
}

func within(root, p string) bool {
	rel, err := filepath.Rel(root, p)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}

func notFound(w http.ResponseWriter, r *http.Request, root string) {
	if b, err := os.ReadFile(filepath.Join(root, "404.html")); err == nil && r.Method == http.MethodGet {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write(b)
		return
	}
	http.Error(w, "404 not found", http.StatusNotFound)
}

func printURLs(addr string, lan bool) {
	host, port := addr, ""
	if i := strings.LastIndex(addr, ":"); i >= 0 {
		host, port = addr[:i], addr[i+1:]
	}
	if host == "" || host == "0.0.0.0" || host == "[::]" {
		host = "localhost"
	}
	fmt.Printf("  http://%s:%s/\n", host, port)
	if lan {
		for _, ip := range lanIPs() {
			fmt.Printf("  http://%s:%s/   （同じ Wi-Fi の スマホ・タブレットから）\n", ip, port)
		}
	}
}
