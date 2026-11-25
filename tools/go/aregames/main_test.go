package main

import (
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
)

// ---------- 小さな見本のリポジトリ（lint の確かめ用） ----------

func tr(ja, en, zh, ko string) map[string]string {
	return map[string]string{"ja": ja, "en": en, "zh": zh, "ko": ko}
}
func tl(ja, en, zh, ko []string) map[string][]string {
	return map[string][]string{"ja": ja, "en": en, "zh": zh, "ko": ko}
}

func sampleRegistry() *Registry {
	mk := func(id, genre string, order int) Game {
		return Game{ID: id, Genre: genre, Folder: id, Href: id + "/index.html", Emoji: "🎮", C1: "#112233", C2: "#445566", Order: order, Gamepad: true,
			InGameLangs: []string{"ja"}, Name: tr("名", "N", "名", "이름"), Sub: tr("副", "S", "副", "부"), Desc: tr("説明", "Desc", "说明", "설명"),
			Tags: tl([]string{"a"}, []string{"a"}, []string{"a"}, []string{"a"})}
	}
	return &Registry{Schema: 1, Langs: langs,
		Genres: []Genre{
			{ID: "rpg", Emoji: "🗡", C1: "#112233", C2: "#445566", Name: tr("R", "R", "R", "R"), Blurb: tr("b", "b", "b", "b"), Tips: tl([]string{"t"}, []string{"t"}, []string{"t"}, []string{"t"})},
			{ID: "sim", Emoji: "🌸", C1: "#112233", C2: "#445566", Name: tr("S", "S", "S", "S"), Blurb: tr("b", "b", "b", "b"), Tips: tl([]string{"t"}, []string{"t"}, []string{"t"}, []string{"t"})},
		},
		Games: []Game{mk("g1", "rpg", 1), mk("g2", "rpg", 2), mk("g3", "sim", 1)}}
}

func write(t *testing.T, root, rel, body string) {
	t.Helper()
	p := filepath.Join(root, filepath.FromSlash(rel))
	if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(p, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

// makeRepo は 見本の一覧から 検査に通る 小さなリポジトリを作る。mutate で 一覧を 壊せる。
func makeRepo(t *testing.T, mutate func(r *Registry)) string {
	t.Helper()
	root := t.TempDir()
	r := sampleRegistry()
	if mutate != nil {
		mutate(r)
	}
	b, _ := json.MarshalIndent(r, "", " ")
	write(t, root, "shared/games-registry.json", string(b))
	write(t, root, "shared/games-data.js", "window.AREGamesData = "+string(b)+";\n")
	page := `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>x</title>`
	for _, g := range r.Games {
		if g.Folder != "" {
			write(t, root, g.ID+"/index.html", page) // 一覧の href を まちがえた ケースを 試せるよう、ページは id の場所に 置く
		}
	}
	write(t, root, "index.html", page+`<a href="genre/index.html">g</a>`)
	write(t, root, "genre/index.html", page)
	for _, g := range r.Genres {
		write(t, root, "thumbs/genre-"+g.ID+".webp", "RIFFxxxxWEBP")
	}
	write(t, root, "sw.js", `const CACHE = "game-v9-20261125";`)
	// precache.json は 今のファイルの とおりに 書く
	var shell, image []string
	for _, f := range []string{"genre/index.html", "g1/index.html", "g2/index.html", "g3/index.html", "index.html", "shared/games-data.js", "shared/games-registry.json"} {
		shell = append(shell, f)
	}
	shell = append(shell, "./", "genre/", "g1/", "g2/", "g3/")
	for _, g := range r.Genres {
		image = append(image, "thumbs/genre-"+g.ID+".webp")
	}
	pc, _ := json.Marshal(map[string]any{"shell": shell, "image": image, "audio": []string{}})
	write(t, root, "precache.json", string(pc))
	return root
}

func levels(is []Issue, level string) []string {
	var r []string
	for _, i := range is {
		if i.Level == level {
			r = append(r, i.Msg)
		}
	}
	return r
}

func hasMsg(is []Issue, sub string) bool {
	for _, i := range is {
		if strings.Contains(i.Msg, sub) {
			return true
		}
	}
	return false
}

func TestLintSampleIsClean(t *testing.T) {
	is := Lint(makeRepo(t, nil))
	if len(is) != 0 {
		t.Fatalf("見本が きれいでない: %v", is)
	}
}

func TestLintCatchesMistakes(t *testing.T) {
	// 虫の語は 文字コードで作る（このファイルが 虫チェックに ひっかからないように）
	bugJa := string(rune(0x866b))           // 虫
	bugKo := string([]rune{0xBC8C, 0xB808}) // 벌레
	bugEmoji := string(rune(0x1F41B))       // 毛虫の絵文字
	spider := string(rune(0x1F577))         // クモの絵文字
	cases := []struct {
		name   string
		mutate func(r *Registry)
		want   string
	}{
		{"英語が空", func(r *Registry) { r.Games[0].Desc["en"] = " " }, "desc.en が空"},
		{"韓国語がない", func(r *Registry) { delete(r.Games[1].Name, "ko") }, "name.ko が空"},
		{"知らない言語", func(r *Registry) { r.Games[0].Name["fr"] = "x" }, "知らない言語"},
		{"タグの数がちがう", func(r *Registry) { r.Games[0].Tags["zh"] = []string{"a", "b"} }, "件数"},
		{"タグが空", func(r *Registry) { r.Games[0].Tags["ko"] = []string{""} }, "空の項目"},
		{"idが重なる", func(r *Registry) { r.Games[1].ID = "g1" }, "重なっている"},
		{"idの文字", func(r *Registry) { r.Games[0].ID = "G 1" }, "id の文字"},
		{"ジャンルがない", func(r *Registry) { r.Games[0].Genre = "nope" }, "がない"},
		{"hrefがない", func(r *Registry) { r.Games[0].Href = "zzz/index.html" }, "href がない"},
		{"hrefが外へ出る", func(r *Registry) { r.Games[0].Href = "../x/index.html" }, "相対パス"},
		{"hrefが絶対", func(r *Registry) { r.Games[0].Href = "/g1/index.html" }, "相対パス"},
		{"外部が別サイト", func(r *Registry) { r.Games[0].Ext = true; r.Games[0].Href = "https://evil.example/x" }, "arechat.github.io のみ"},
		{"外部がhttp", func(r *Registry) { r.Games[0].Ext = true; r.Games[0].Href = "http://arechat.github.io/x" }, "arechat.github.io のみ"},
		{"画像がない", func(r *Registry) { r.Games[0].Img = "thumbs/none.webp" }, "画像がない"},
		{"色がおかしい", func(r *Registry) { r.Games[0].C1 = "red" }, "色"},
		{"ジャンルの色", func(r *Registry) { r.Genres[0].C2 = "#12" }, "色"},
		{"orderの欠け", func(r *Registry) { r.Games[1].Order = 3 }, "連番"},
		{"orderの重なり", func(r *Registry) { r.Games[1].Order = 1 }, "連番"},
		{"20歳以上がsimでない", func(r *Registry) { r.Games[0].Adult = true }, "sim に置く"},
		{"inGameLangsにjaがない", func(r *Registry) { r.Games[0].InGameLangs = []string{"en"} }, "ja がない"},
		{"inGameLangsの変な値", func(r *Registry) { r.Games[0].InGameLangs = []string{"ja", "fr"} }, "inGameLangs"},
		{"虫(日本語)", func(r *Registry) { r.Games[0].Desc["ja"] = "かわいい" + bugJa + "が出る" }, "虫に関する"},
		{"虫(韓国語)", func(r *Registry) { r.Games[0].Desc["ko"] = bugKo }, "虫に関する"},
		{"虫(絵文字)", func(r *Registry) { r.Games[0].Emoji = bugEmoji }, "虫に関する"},
		{"虫(クモ絵文字)", func(r *Registry) { r.Games[2].Sub["ja"] = spider }, "虫に関する"},
		{"虫(英語 insect)", func(r *Registry) { r.Games[0].Name["en"] = "Insect Quest" }, "虫に関する"},
		{"虫(ジャンル側)", func(r *Registry) { r.Genres[0].Blurb["zh"] = bugJa }, "虫に関する"},
		{"emojiが空", func(r *Registry) { r.Games[0].Emoji = "" }, "emoji"},
		{"ジャンルにゲームなし", func(r *Registry) {
			r.Genres = append(r.Genres, Genre{ID: "empty", Emoji: "x", C1: "#000000", C2: "#ffffff", Name: tr("e", "e", "e", "e"), Blurb: tr("e", "e", "e", "e"), Tips: tl([]string{"t"}, []string{"t"}, []string{"t"}, []string{"t"})})
		}, "1本もない"},
		{"schema", func(r *Registry) { r.Schema = 2 }, "schema"},
		{"langsの順", func(r *Registry) { r.Langs = []string{"en", "ja", "zh", "ko"} }, "langs"},
	}
	for _, c := range cases {
		root := makeRepo(t, c.mutate)
		// 一覧を 直した あとの 見本は games-data と 表紙が ずれることがあるので、必要なファイルは 作り直されている（makeRepo）
		is := Lint(root)
		if !hasMsg(is, c.want) {
			t.Errorf("%s: 「%s」を 見つけられなかった。出たもの: %v", c.name, c.want, is)
		}
	}
}

func TestLintFileProblems(t *testing.T) {
	t.Run("viewportなし", func(t *testing.T) {
		root := makeRepo(t, nil)
		write(t, root, "g1/index.html", "<!doctype html><title>x</title>")
		if !hasMsg(Lint(root), "viewport") {
			t.Fatal("viewport なしを 見つけられない")
		}
	})
	t.Run("games-dataがずれ", func(t *testing.T) {
		root := makeRepo(t, nil)
		write(t, root, "shared/games-data.js", "window.AREGamesData = {\"schema\":1};\n")
		if !hasMsg(Lint(root), "games-data.js が") {
			t.Fatal("ずれを 見つけられない")
		}
	})
	t.Run("games-dataがない", func(t *testing.T) {
		root := makeRepo(t, nil)
		os.Remove(filepath.Join(root, "shared/games-data.js"))
		if !hasMsg(Lint(root), "games-data.js がない") {
			t.Fatal("ない を 見つけられない")
		}
	})
	t.Run("games-dataの形", func(t *testing.T) {
		root := makeRepo(t, nil)
		write(t, root, "shared/games-data.js", "nothing here")
		if !hasMsg(Lint(root), "形がちがう") {
			t.Fatal("形の まちがい を 見つけられない")
		}
	})
	t.Run("表紙がない", func(t *testing.T) {
		root := makeRepo(t, nil)
		os.Remove(filepath.Join(root, "thumbs/genre-rpg.webp"))
		if !hasMsg(Lint(root), "表紙") {
			t.Fatal("表紙なしを 見つけられない")
		}
	})
	t.Run("swの名前", func(t *testing.T) {
		root := makeRepo(t, nil)
		write(t, root, "sw.js", `const CACHE = "weird";`)
		if !hasMsg(Lint(root), "CACHE") {
			t.Fatal("sw を 見つけられない")
		}
	})
	t.Run("swがない", func(t *testing.T) {
		root := makeRepo(t, nil)
		os.Remove(filepath.Join(root, "sw.js"))
		if !hasMsg(Lint(root), "sw.js がない") {
			t.Fatal()
		}
	})
	t.Run("precacheに足りない", func(t *testing.T) {
		root := makeRepo(t, nil)
		write(t, root, "g1/extra.js", "1")
		if !hasMsg(Lint(root), "足りない") {
			t.Fatal("precache の足りなさを 見つけられない")
		}
	})
	t.Run("precacheに消えたファイル", func(t *testing.T) {
		root := makeRepo(t, nil)
		os.Remove(filepath.Join(root, "g3/index.html"))
		is := Lint(root)
		if !hasMsg(is, "消えたファイル") {
			t.Fatalf("消えたファイルを 見つけられない: %v", is)
		}
	})
	t.Run("precacheがない", func(t *testing.T) {
		root := makeRepo(t, nil)
		os.Remove(filepath.Join(root, "precache.json"))
		if !hasMsg(Lint(root), "precache.json がない") {
			t.Fatal()
		}
	})
	t.Run("precacheがこわれ", func(t *testing.T) {
		root := makeRepo(t, nil)
		write(t, root, "precache.json", "{{{")
		if !hasMsg(Lint(root), "読めない") {
			t.Fatal()
		}
	})
	t.Run("リンク切れ(入口はNG・ゲームは警告)", func(t *testing.T) {
		root := makeRepo(t, nil)
		write(t, root, "index.html", `<!doctype html><meta name="viewport" content="x"><a href="nope.html">x</a><img src="a/b.png"><a href="https://x.example/y">ok</a><a href="#top">ok</a>`)
		write(t, root, "g1/index.html", `<!doctype html><meta name="viewport" content="x"><script src="missing.js"></script>`)
		is := Lint(root)
		if !hasMsg(levelsIssues(is, "NG"), "nope.html") || !hasMsg(levelsIssues(is, "NG"), "a/b.png") {
			t.Fatalf("入口のリンク切れ: %v", is)
		}
		if !hasMsg(levelsIssues(is, "警告"), "missing.js") {
			t.Fatalf("ゲームのリンク切れは 警告: %v", is)
		}
		if hasMsg(is, "x.example") || hasMsg(is, "#top") {
			t.Fatalf("外部・ページ内リンクは 見ない: %v", is)
		}
	})
	t.Run("JSの文字列つなぎは リンクと見ない", func(t *testing.T) {
		root := makeRepo(t, nil)
		write(t, root, "index.html", `<!doctype html><meta name="viewport" content="x"><script>var s='<img src="thumbs/genre-' + id + '.webp">';var t="<a href='x" + y + "'>";</script>`)
		write(t, root, "precache.json", func() string { b, _ := os.ReadFile(filepath.Join(root, "precache.json")); return string(b) }())
		is := Lint(root)
		if hasMsg(is, "リンク切れ") {
			t.Fatalf("JSのつなぎを リンク切れ扱い: %v", is)
		}
	})
	t.Run("一覧が読めない・形がちがう", func(t *testing.T) {
		root := makeRepo(t, nil)
		write(t, root, "shared/games-registry.json", "{{")
		if len(Lint(root)) != 1 {
			t.Fatal("読めない一覧は 1件で 打ち切る")
		}
		write(t, root, "shared/games-registry.json", `{"schema":1,"unknown":true}`)
		if !hasMsg(Lint(root), "形がちがいます") {
			t.Fatal("知らない項目を 断る")
		}
		os.Remove(filepath.Join(root, "shared/games-registry.json"))
		if !hasMsg(Lint(root), "読めません") {
			t.Fatal("一覧が ない")
		}
	})
}

func levelsIssues(is []Issue, level string) []Issue {
	var r []Issue
	for _, i := range is {
		if i.Level == level {
			r = append(r, i)
		}
	}
	return r
}

// 本物のリポジトリ（このツールの 3つ上）は NG 0件
func TestLintRealRepo(t *testing.T) {
	root := filepath.Join("..", "..", "..")
	if _, err := os.Stat(filepath.Join(root, "shared", "games-registry.json")); err != nil {
		t.Skip("リポジトリの中で 実行していない")
	}
	if ng := levels(Lint(root), "NG"); len(ng) > 0 {
		t.Fatalf("本物の一覧に NG: %v", ng)
	}
}

// ---------- サーバー ----------

func serverRepo(t *testing.T) (string, string) {
	t.Helper()
	parent := t.TempDir()
	root := filepath.Join(parent, "site")
	write(t, root, "index.html", "<h1>hub</h1>")
	write(t, root, "genre/index.html", "<h1>genre</h1>")
	write(t, root, "game/index.html", "<h1>game</h1>")
	write(t, root, "empty/readme.txt", "no index")
	write(t, root, "a.wasm", "\x00asm\x01\x00\x00\x00")
	write(t, root, "b.js", "console.log(1)")
	write(t, root, "c.json", "{}")
	write(t, root, "d.webp", "RIFF....WEBP")
	write(t, root, "e.mp3", strings.Repeat("0123456789", 1000))
	write(t, root, "f.webmanifest", "{}")
	write(t, root, "sub dir/日本語.txt", "こんにちは")
	write(t, root, ".git/config", "SECRET-GIT")
	write(t, root, ".env", "SECRET-ENV")
	write(t, root, "node_modules/x/index.js", "SECRET-NM")
	write(t, root, "shared/games-registry.json", func() string { b, _ := json.Marshal(sampleRegistry()); return string(b) }())
	write(t, parent, "outside.txt", "OUTSIDE-SECRET")
	if err := os.Symlink(parent, filepath.Join(root, "link-out")); err != nil {
		t.Logf("symlink 作れない: %v", err)
	}
	return root, parent
}

func get(t *testing.T, base, p string, hdr map[string]string) (*http.Response, string) {
	t.Helper()
	req, _ := http.NewRequest("GET", base+p, nil)
	for k, v := range hdr {
		req.Header.Set(k, v)
	}
	c := &http.Client{CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	resp, err := c.Do(req)
	if err != nil {
		t.Fatalf("GET %s: %v", p, err)
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	return resp, string(b)
}

// rawGet は 「..」などを 直さずに そのまま送る
func rawGet(t *testing.T, base, rawPath string) (int, string) {
	t.Helper()
	u, _ := url.Parse(base)
	conn, err := net.Dial("tcp", u.Host)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	io.WriteString(conn, "GET "+rawPath+" HTTP/1.1\r\nHost: "+u.Host+"\r\nConnection: close\r\n\r\n")
	b, _ := io.ReadAll(conn)
	s := string(b)
	code := 0
	if len(s) > 12 {
		code = int(s[9]-'0')*100 + int(s[10]-'0')*10 + int(s[11]-'0')
	}
	return code, s
}

func TestServe(t *testing.T) {
	root, _ := serverRepo(t)
	ts := httptest.NewServer(NewHandler(root))
	defer ts.Close()

	t.Run("入口とフォルダ", func(t *testing.T) {
		for p, want := range map[string]string{"/": "hub", "/index.html": "hub", "/genre/": "genre", "/genre/index.html?g=rpg&back=x": "genre", "//index.html": "hub", "/game/": "game"} {
			resp, body := get(t, ts.URL, p, nil)
			if resp.StatusCode != 200 || !strings.Contains(body, want) {
				t.Errorf("%s → %d %q", p, resp.StatusCode, body)
			}
		}
	})
	t.Run("スラッシュなしは リダイレクト（?も残す）", func(t *testing.T) {
		resp, _ := get(t, ts.URL, "/genre?g=rpg", nil)
		if resp.StatusCode != 301 || resp.Header.Get("Location") != "/genre/?g=rpg" {
			t.Errorf("%d %s", resp.StatusCode, resp.Header.Get("Location"))
		}
	})
	t.Run("indexのないフォルダ", func(t *testing.T) {
		resp, _ := get(t, ts.URL, "/empty/", nil)
		if resp.StatusCode != 404 {
			t.Errorf("%d", resp.StatusCode)
		}
	})
	t.Run("種類（MIME）", func(t *testing.T) {
		for p, want := range map[string]string{"/a.wasm": "application/wasm", "/b.js": "text/javascript", "/c.json": "application/json", "/d.webp": "image/webp", "/e.mp3": "audio/mpeg", "/f.webmanifest": "application/manifest+json", "/index.html": "text/html", "/sub%20dir/%E6%97%A5%E6%9C%AC%E8%AA%9E.txt": "text/plain"} {
			resp, _ := get(t, ts.URL, p, nil)
			if !strings.HasPrefix(resp.Header.Get("Content-Type"), want) {
				t.Errorf("%s → %s", p, resp.Header.Get("Content-Type"))
			}
			if resp.Header.Get("X-Content-Type-Options") != "nosniff" {
				t.Errorf("%s: nosniff がない", p)
			}
		}
	})
	t.Run("日本語のファイル名", func(t *testing.T) {
		resp, body := get(t, ts.URL, "/sub%20dir/%E6%97%A5%E6%9C%AC%E8%AA%9E.txt", nil)
		if resp.StatusCode != 200 || body != "こんにちは" {
			t.Errorf("%d %q", resp.StatusCode, body)
		}
	})
	t.Run("Range（音楽の頭出し）", func(t *testing.T) {
		resp, body := get(t, ts.URL, "/e.mp3", map[string]string{"Range": "bytes=10-19"})
		if resp.StatusCode != 206 || body != "0123456789" || resp.Header.Get("Content-Range") != "bytes 10-19/10000" {
			t.Errorf("%d %q %s", resp.StatusCode, body, resp.Header.Get("Content-Range"))
		}
		resp, _ = get(t, ts.URL, "/e.mp3", map[string]string{"Range": "bytes=999999-"})
		if resp.StatusCode != 416 {
			t.Errorf("範囲外は 416: %d", resp.StatusCode)
		}
		resp, body = get(t, ts.URL, "/e.mp3", map[string]string{"Range": "bytes=-5"})
		if resp.StatusCode != 206 || len(body) != 5 {
			t.Errorf("末尾5バイト: %d %q", resp.StatusCode, body)
		}
		if resp.Header.Get("Accept-Ranges") != "bytes" {
			t.Errorf("Accept-Ranges")
		}
	})
	t.Run("ETag と 304", func(t *testing.T) {
		resp, _ := get(t, ts.URL, "/b.js", nil)
		et := resp.Header.Get("ETag")
		if et == "" || resp.Header.Get("Cache-Control") != "no-cache" {
			t.Fatalf("ETag=%q CC=%q", et, resp.Header.Get("Cache-Control"))
		}
		resp, body := get(t, ts.URL, "/b.js", map[string]string{"If-None-Match": et})
		if resp.StatusCode != 304 || body != "" {
			t.Errorf("304 にならない: %d", resp.StatusCode)
		}
		resp, _ = get(t, ts.URL, "/b.js", map[string]string{"If-None-Match": `"other"`})
		if resp.StatusCode != 200 {
			t.Errorf("ちがう ETag は 200: %d", resp.StatusCode)
		}
		resp, _ = get(t, ts.URL, "/d.webp", nil)
		if !strings.Contains(resp.Header.Get("Cache-Control"), "max-age") {
			t.Errorf("画像は 少し 覚えさせる: %s", resp.Header.Get("Cache-Control"))
		}
	})
	t.Run("HEAD", func(t *testing.T) {
		req, _ := http.NewRequest("HEAD", ts.URL+"/e.mp3", nil)
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		b, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != 200 || len(b) != 0 || resp.ContentLength != 10000 {
			t.Errorf("HEAD: %d len=%d cl=%d", resp.StatusCode, len(b), resp.ContentLength)
		}
	})
	t.Run("GET以外", func(t *testing.T) {
		for _, m := range []string{"POST", "PUT", "DELETE", "PATCH"} {
			req, _ := http.NewRequest(m, ts.URL+"/index.html", strings.NewReader("x"))
			resp, _ := http.DefaultClient.Do(req)
			resp.Body.Close()
			if resp.StatusCode != 405 || !strings.Contains(resp.Header.Get("Allow"), "GET") {
				t.Errorf("%s → %d", m, resp.StatusCode)
			}
		}
		req, _ := http.NewRequest("OPTIONS", ts.URL+"/", nil)
		resp, _ := http.DefaultClient.Do(req)
		resp.Body.Close()
		if resp.StatusCode != 204 {
			t.Errorf("OPTIONS %d", resp.StatusCode)
		}
	})
	t.Run("外へ出る道は ぜんぶ 断る", func(t *testing.T) {
		bad := []string{"/../outside.txt", "/%2e%2e/outside.txt", "/%2E%2E/%2E%2E/outside.txt", "/..%2foutside.txt", "/a/../../outside.txt", "/..;/outside.txt",
			"/genre/../../outside.txt", "/%2e%2e%2foutside.txt", "/link-out/outside.txt", "/link-out/", "/....//outside.txt", "/.%2e/outside.txt", "/%252e%252e/outside.txt",
			"/..\\outside.txt", "/..%5coutside.txt"}
		for _, p := range bad {
			code, raw := rawGet(t, ts.URL, p)
			if strings.Contains(raw, "OUTSIDE-SECRET") {
				t.Errorf("外のファイルが 読めた: %s", p)
			}
			if code == 200 && !strings.Contains(p, "..;") {
				// 200 でも 中身が 入口などの 正しいファイルなら 問題なし（.. が 取りのぞかれた結果）
				if !strings.Contains(raw, "<h1>") && !strings.Contains(raw, "hub") {
					t.Errorf("%s → 200 で 変な中身: %.80q", p, raw)
				}
			}
		}
	})
	t.Run("隠しファイル", func(t *testing.T) {
		for _, p := range []string{"/.git/config", "/.env", "/.git/", "/node_modules/x/index.js", "/genre/.hidden", "/%2egit/config", "/.GIT/config", "/./.env"} {
			code, raw := rawGet(t, ts.URL, p)
			if code == 200 || strings.Contains(raw, "SECRET") {
				t.Errorf("%s → %d 読めてしまった", p, code)
			}
		}
	})
	t.Run("へんな入力", func(t *testing.T) {
		for _, p := range []string{"/%00", "/index.html%00.png", "/%ff%fe", "/" + strings.Repeat("a", 5000), "/" + strings.Repeat("../", 200) + "etc/passwd", "/%", "/%zz", "/index.html/", "/./index.html", "/genre//index.html"} {
			code, raw := rawGet(t, ts.URL, p)
			if code == 500 || code == 0 {
				t.Errorf("%.30s → %d", p, code)
			}
			if strings.Contains(raw, "root:x:0") {
				t.Errorf("/etc/passwd が 読めた")
			}
		}
	})
	t.Run("見つからない", func(t *testing.T) {
		resp, _ := get(t, ts.URL, "/nope.html", nil)
		if resp.StatusCode != 404 {
			t.Errorf("%d", resp.StatusCode)
		}
		write(t, root, "404.html", "<h1>がっかり</h1>")
		resp, body := get(t, ts.URL, "/nope.html", nil)
		if resp.StatusCode != 404 || !strings.Contains(body, "がっかり") {
			t.Errorf("404.html を 使う: %d %q", resp.StatusCode, body)
		}
		os.Remove(filepath.Join(root, "404.html"))
	})
	t.Run("health", func(t *testing.T) {
		resp, body := get(t, ts.URL, "/__health", nil)
		var m map[string]any
		if json.Unmarshal([]byte(body), &m) != nil || m["ok"] != true || m["games"].(float64) != 3 || resp.Header.Get("Cache-Control") != "no-store" {
			t.Errorf("%d %s", resp.StatusCode, body)
		}
	})
	t.Run("同時アクセス", func(t *testing.T) {
		var wg sync.WaitGroup
		errs := make(chan string, 200)
		for i := 0; i < 100; i++ {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				p := []string{"/", "/e.mp3", "/b.js", "/nope", "/genre/?g=rpg"}[i%5]
				resp, err := http.Get(ts.URL + p)
				if err != nil {
					errs <- err.Error()
					return
				}
				io.Copy(io.Discard, resp.Body)
				resp.Body.Close()
				if resp.StatusCode >= 500 {
					errs <- p
				}
			}(i)
		}
		wg.Wait()
		close(errs)
		for e := range errs {
			t.Errorf("同時アクセスで %s", e)
		}
	})
}

func TestServeMissingRootAndEdge(t *testing.T) {
	// 配るフォルダに 一覧がなくても /__health は 動く
	root := t.TempDir()
	ts := httptest.NewServer(NewHandler(root))
	defer ts.Close()
	_, body := get(t, ts.URL, "/__health", nil)
	if !strings.Contains(body, `"games":0`) {
		t.Errorf("%s", body)
	}
	resp, _ := get(t, ts.URL, "/", nil)
	if resp.StatusCode != 404 {
		t.Errorf("index.html のない ルート: %d", resp.StatusCode)
	}
}

func TestRunCommands(t *testing.T) {
	null, _ := os.OpenFile(os.DevNull, os.O_WRONLY, 0)
	defer null.Close()
	if run(nil, null, null) != 2 || run([]string{"zzz"}, null, null) != 2 || run([]string{"version"}, null, null) != 0 {
		t.Error("引数の扱い")
	}
	if run([]string{"serve", "-root", "/no/such/dir"}, null, null) != 2 {
		t.Error("serve: フォルダなし")
	}
	if run([]string{"lint", "-badflag"}, null, null) != 2 {
		t.Error("lint: 変な引数")
	}
	root := makeRepo(t, nil)
	if run([]string{"lint", "-root", root}, null, null) != 0 {
		t.Error("lint: きれいな見本")
	}
	bad := makeRepo(t, func(r *Registry) { r.Games[0].Desc["en"] = "" })
	if run([]string{"lint", "-root", bad}, null, null) != 1 {
		t.Error("lint: NG なら 1")
	}
	// 警告だけ → 通常は 0、-strict は 1
	w := makeRepo(t, nil)
	write(t, w, "g1/index.html", `<!doctype html><meta name="viewport" content="x"><script src="missing.js"></script>`)
	if run([]string{"lint", "-root", w}, null, null) != 0 {
		t.Error("警告だけなら 0")
	}
	if run([]string{"lint", "-root", w, "-strict"}, null, null) != 1 {
		t.Error("-strict で 警告も 失敗")
	}
}
