package main

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"sort"
	"strings"
)

// Issue は 見つけた問題。Level は "NG"（直す）か "警告"。
type Issue struct {
	Level string
	Msg   string
}

var (
	langs      = []string{"ja", "en", "zh", "ko"}
	colorRe    = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
	idRe       = regexp.MustCompile(`^[a-z0-9-]+$`)
	extOKRe    = regexp.MustCompile(`^https://arechat\.github\.io/`)
	cacheRe    = regexp.MustCompile(`const CACHE = "game-v(\d+)-(\d{8})"`)
	viewportRe = regexp.MustCompile(`(?i)<meta[^>]+name=["']viewport["']`)
	// 虫は一切出さない（絵文字・文言）。語は 文字コードで書く（虫チェックの道具に 自分が ひっかからないように）
	bugRe = regexp.MustCompile(`(?i)[\x{1F41B}-\x{1F41E}\x{1FAB0}-\x{1FAB3}\x{1F577}\x{1F578}\x{1F982}]|\x{866b}|\x{87f2}|\x{BC8C}\x{B808}|\x{ACE0}\x{CDA9}|\binsects?\b|\bbugs?\b`)
	// gen-precache.js と同じ数え方
	skipDir  = map[string]bool{".git": true, "node_modules": true, "docs": true, "tools": true, ".github": true, "sql": true, "edge-functions": true, "desktop": true, "3ds": true, "csharp-achievements": true}
	shellRe  = regexp.MustCompile(`(?i)\.(html|js|css|json|webmanifest|txt|wasm)$`)
	mediaRe  = regexp.MustCompile(`(?i)\.(webp|png|jpg|jpeg|gif|svg|ico)$`)
	audioRe  = regexp.MustCompile(`(?i)\.(mp3|ogg|wav|m4a)$`)
	skipFile = regexp.MustCompile(`^(sw\.js|precache-manifest\.js|precache\.json|googlea.*\.html|robots\.txt|sitemap\.xml)$`)
	linkRe   = regexp.MustCompile(`(?i)\b(?:href|src)\s*=\s*(["'])([^"'#?][^"']*)(["'])`)
)

// Lint は root（ゲームのリポジトリ）の 一覧と 周辺を 検査する。
func Lint(root string) []Issue {
	var is []Issue
	ng := func(f string, a ...any) { is = append(is, Issue{"NG", fmt.Sprintf(f, a...)}) }
	warn := func(f string, a ...any) { is = append(is, Issue{"警告", fmt.Sprintf(f, a...)}) }

	reg, raw, err := loadRegistry(root)
	if err != nil {
		return []Issue{{"NG", err.Error()}}
	}
	if reg.Schema != 1 {
		ng("schema は 1 のはず: %d", reg.Schema)
	}
	if !reflect.DeepEqual(reg.Langs, langs) {
		ng("langs は %v のはず: %v", langs, reg.Langs)
	}
	genreIDs := map[string]bool{}
	for _, g := range reg.Genres {
		if !idRe.MatchString(g.ID) {
			ng("ジャンル %q: id の文字", g.ID)
		}
		if genreIDs[g.ID] {
			ng("ジャンル %q: id が重なっている", g.ID)
		}
		genreIDs[g.ID] = true
		need(g.Name, "ジャンル "+g.ID+".name", &is)
		need(g.Blurb, "ジャンル "+g.ID+".blurb", &is)
		needList(g.Tips, "ジャンル "+g.ID+".tips", &is)
		if !colorRe.MatchString(g.C1) || !colorRe.MatchString(g.C2) {
			ng("ジャンル %s: 色", g.ID)
		}
		if g.Emoji == "" {
			ng("ジャンル %s: emoji", g.ID)
		}
		if _, e := os.Stat(filepath.Join(root, "thumbs", "genre-"+g.ID+".webp")); e != nil {
			ng("ジャンル %s: 表紙 thumbs/genre-%s.webp がない（python3 tools/py/genre_covers.py）", g.ID, g.ID)
		}
		n := 0
		for _, x := range reg.Games {
			if x.Genre == g.ID {
				n++
			}
		}
		if n == 0 {
			ng("ジャンル %s: ゲームが1本もない", g.ID)
		}
		if bugRe.MatchString(flattenAny(g)) {
			ng("ジャンル %s: 虫に関する語・絵文字（虫は一切出さない）", g.ID)
		}
	}
	ids := map[string]bool{}
	orders := map[string][]int{}
	for _, g := range reg.Games {
		if ids[g.ID] {
			ng("ゲーム %q: id が重なっている", g.ID)
		}
		ids[g.ID] = true
		if !idRe.MatchString(g.ID) {
			ng("ゲーム %q: id の文字", g.ID)
		}
		if !genreIDs[g.Genre] {
			ng("ゲーム %s: ジャンル %q がない", g.ID, g.Genre)
		}
		orders[g.Genre] = append(orders[g.Genre], g.Order)
		for k, m := range map[string]map[string]string{"name": g.Name, "sub": g.Sub, "desc": g.Desc} {
			need(m, "ゲーム "+g.ID+"."+k, &is)
		}
		needList(g.Tags, "ゲーム "+g.ID+".tags", &is)
		if !colorRe.MatchString(g.C1) || !colorRe.MatchString(g.C2) {
			ng("ゲーム %s: 色", g.ID)
		}
		if g.Ext {
			if !extOKRe.MatchString(g.Href) {
				ng("ゲーム %s: 外部リンクは arechat.github.io のみ: %s", g.ID, g.Href)
			}
		} else {
			if strings.Contains(g.Href, "..") || strings.HasPrefix(g.Href, "/") || strings.Contains(g.Href, "://") {
				ng("ゲーム %s: href が内部の相対パスでない: %s", g.ID, g.Href)
			} else if b, e := os.ReadFile(filepath.Join(root, g.Href)); e != nil {
				ng("ゲーム %s: href がない %s", g.ID, g.Href)
			} else if !viewportRe.Match(b) {
				ng("ゲーム %s: %s に viewport の指定がない（スマホで崩れる）", g.ID, g.Href)
			}
			if g.Folder == "" {
				ng("ゲーム %s: folder が空", g.ID)
			} else if st, e := os.Stat(filepath.Join(root, g.Folder)); e != nil || !st.IsDir() {
				ng("ゲーム %s: folder がない %s", g.ID, g.Folder)
			}
		}
		if g.Img != "" {
			if _, e := os.Stat(filepath.Join(root, g.Img)); e != nil {
				ng("ゲーム %s: 画像がない %s", g.ID, g.Img)
			}
		}
		if g.Adult && g.Genre != "sim" {
			ng("ゲーム %s: 20歳以上は sim に置く", g.ID)
		}
		if !contains(g.InGameLangs, "ja") {
			ng("ゲーム %s: inGameLangs に ja がない", g.ID)
		}
		for _, l := range g.InGameLangs {
			if !contains(langs, l) {
				ng("ゲーム %s: inGameLangs %q", g.ID, l)
			}
		}
		if g.Emoji == "" {
			ng("ゲーム %s: emoji", g.ID)
		}
		if bugRe.MatchString(flattenAny(g)) {
			ng("ゲーム %s: 虫に関する語・絵文字（虫は一切出さない）", g.ID)
		}
	}
	for gid, os_ := range orders {
		sort.Ints(os_)
		for i, o := range os_ {
			if o != i+1 {
				ng("ジャンル %s: order が 1,2,3… の連番でない: %v", gid, os_)
				break
			}
		}
	}

	// games-data.js が 一覧と 同じ内容か
	if b, e := os.ReadFile(filepath.Join(root, "shared", "games-data.js")); e != nil {
		ng("shared/games-data.js がない（node tools/build-registry.js）")
	} else {
		s := strings.TrimSpace(string(b))
		const head = "window.AREGamesData = "
		i := strings.Index(s, head)
		if i < 0 {
			ng("games-data.js の形がちがう")
		} else {
			body := strings.TrimSuffix(strings.TrimSpace(s[i+len(head):]), ";")
			var a, c any
			if json.Unmarshal([]byte(body), &a) != nil || json.Unmarshal(raw, &c) != nil || !reflect.DeepEqual(a, c) {
				ng("games-data.js が 一覧（games-registry.json）と ちがう（node tools/build-registry.js）")
			}
		}
	}

	// sw.js のキャッシュ名
	if b, e := os.ReadFile(filepath.Join(root, "sw.js")); e != nil {
		ng("sw.js がない")
	} else if !cacheRe.Match(b) {
		ng("sw.js の CACHE が game-vN-YYYYMMDD の形でない")
	}

	// オフライン用の一覧（precache.json）が 今のファイルと 合っているか（gen-precache.js と同じ数え方）
	is = append(is, lintPrecache(root)...)

	// 入口・ジャンルページ・各ゲームの入口ページの リンク切れ
	pages := []string{"index.html", "genre/index.html"}
	for _, g := range reg.Games {
		if !g.Ext {
			pages = append(pages, g.Href)
		}
	}
	for _, p := range pages {
		for _, bad := range brokenLinks(root, p) {
			if p == "index.html" || p == "genre/index.html" {
				ng("リンク切れ %s → %s", p, bad)
			} else {
				warn("リンク切れ %s → %s", p, bad)
			}
		}
	}
	return is
}

func contains(a []string, s string) bool {
	for _, x := range a {
		if x == s {
			return true
		}
	}
	return false
}

func flattenAny(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func need(m map[string]string, where string, is *[]Issue) {
	for _, l := range langs {
		if strings.TrimSpace(m[l]) == "" {
			*is = append(*is, Issue{"NG", fmt.Sprintf("%s.%s が空", where, l)})
		}
	}
	for k := range m {
		if !contains(langs, k) {
			*is = append(*is, Issue{"NG", fmt.Sprintf("%s: 知らない言語 %q", where, k)})
		}
	}
}

func needList(m map[string][]string, where string, is *[]Issue) {
	n := len(m["ja"])
	if n == 0 {
		*is = append(*is, Issue{"NG", where + ".ja が空"})
	}
	for _, l := range langs {
		if len(m[l]) != n {
			*is = append(*is, Issue{"NG", fmt.Sprintf("%s.%s の件数 %d が 日本語 %d とちがう", where, l, len(m[l]), n)})
		}
		for _, s := range m[l] {
			if strings.TrimSpace(s) == "" {
				*is = append(*is, Issue{"NG", fmt.Sprintf("%s.%s に空の項目", where, l)})
			}
		}
	}
}

type precache struct {
	Shell []string `json:"shell"`
	Image []string `json:"image"`
	Audio []string `json:"audio"`
}

func lintPrecache(root string) []Issue {
	var is []Issue
	b, err := os.ReadFile(filepath.Join(root, "precache.json"))
	if err != nil {
		return []Issue{{"NG", "precache.json がない（node tools/gen-precache.js）"}}
	}
	var pc precache
	if json.Unmarshal(b, &pc) != nil {
		return []Issue{{"NG", "precache.json が読めない"}}
	}
	wantShell, wantImg, wantAud := map[string]bool{}, map[string]bool{}, map[string]bool{}
	filepath.WalkDir(root, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		rel, _ := filepath.Rel(root, p)
		rel = filepath.ToSlash(rel)
		if d.IsDir() {
			if rel != "." && skipDir[d.Name()] {
				return filepath.SkipDir
			}
			return nil
		}
		if skipFile.MatchString(d.Name()) || strings.HasSuffix(rel, "/sw.js") {
			return nil
		}
		switch {
		case audioRe.MatchString(d.Name()):
			wantAud[rel] = true
		case mediaRe.MatchString(d.Name()):
			wantImg[rel] = true
		case shellRe.MatchString(d.Name()):
			wantShell[rel] = true
		}
		return nil
	})
	for f := range wantShell {
		if f == "index.html" {
			wantShell["./"] = true
		} else if strings.HasSuffix(f, "/index.html") {
			wantShell[strings.TrimSuffix(f, "index.html")] = true
		}
	}
	cmp := func(name string, have []string, want map[string]bool) {
		hs := map[string]bool{}
		for _, f := range have {
			hs[f] = true
		}
		var miss, extra []string
		for f := range want {
			if !hs[f] {
				miss = append(miss, f)
			}
		}
		for f := range hs {
			if !want[f] {
				extra = append(extra, f)
			}
		}
		sort.Strings(miss)
		sort.Strings(extra)
		if len(miss) > 0 {
			is = append(is, Issue{"NG", fmt.Sprintf("precache.json の %s に 足りない %d 件（node tools/gen-precache.js）例: %s", name, len(miss), strings.Join(firstN(miss, 3), ", "))})
		}
		if len(extra) > 0 {
			is = append(is, Issue{"NG", fmt.Sprintf("precache.json の %s に 消えたファイルが %d 件 例: %s", name, len(extra), strings.Join(firstN(extra, 3), ", "))})
		}
	}
	cmp("shell", pc.Shell, wantShell)
	cmp("image", pc.Image, wantImg)
	cmp("audio", pc.Audio, wantAud)
	return is
}

func firstN(a []string, n int) []string {
	if len(a) > n {
		return a[:n]
	}
	return a
}

// brokenLinks は html の href/src のうち、このリポジトリの中のファイルを指すのに 存在しないものを返す。
func brokenLinks(root, page string) []string {
	b, err := os.ReadFile(filepath.Join(root, page))
	if err != nil {
		return nil
	}
	var bad []string
	seen := map[string]bool{}
	dir := filepath.Dir(page)
	for _, m := range linkRe.FindAllStringSubmatch(string(b), -1) {
		if m[1] != m[3] {
			continue // 開きと閉じの引用符が ちがう ＝ JS の文字列つなぎ（'… + x + …'）
		}
		u := m[2]
		if strings.HasPrefix(u, "http:") || strings.HasPrefix(u, "https:") || strings.HasPrefix(u, "//") || strings.HasPrefix(u, "mailto:") ||
			strings.HasPrefix(u, "javascript:") || strings.HasPrefix(u, "data:") || strings.HasPrefix(u, "blob:") || strings.HasPrefix(u, "tel:") {
			continue
		}
		if i := strings.IndexAny(u, "?#"); i >= 0 {
			u = u[:i]
		}
		if u == "" || strings.ContainsAny(u, "'\"+{}$") || strings.Contains(u, "<") {
			continue // JS の文字列つなぎ・テンプレート
		}
		var full string
		if strings.HasPrefix(u, "/") {
			full = filepath.Join(root, u)
		} else {
			full = filepath.Join(root, dir, u)
		}
		if seen[full] {
			continue
		}
		seen[full] = true
		if rel, e := filepath.Rel(root, full); e != nil || strings.HasPrefix(rel, "..") {
			continue
		}
		if st, e := os.Stat(full); e != nil {
			bad = append(bad, m[2])
		} else if st.IsDir() {
			if _, e2 := os.Stat(filepath.Join(full, "index.html")); e2 != nil {
				bad = append(bad, m[2])
			}
		}
	}
	return bad
}
