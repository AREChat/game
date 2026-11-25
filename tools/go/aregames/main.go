// aregames：ARE ゲーム置き場の 検査（lint）と ローカルサーバー（serve）。Go 標準ライブラリだけで動きます。
//
//	go run . lint  [-root ../../..] [-strict]   … 一覧・リンク・オフライン用の一覧・虫 を検査（NG があれば 終了コード 1）
//	go run . serve [-root ../../..] [-addr 127.0.0.1:8098] [-lan]   … 試し遊び用のサーバー（.wasm の種類・音楽の頭出し(Range)つき）
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sort"
	"time"
)

const version = "1.0.0"

func main() { os.Exit(run(os.Args[1:], os.Stdout, os.Stderr)) }

func run(args []string, out, errw *os.File) int {
	if len(args) == 0 {
		usage(errw)
		return 2
	}
	switch args[0] {
	case "lint":
		fs := flag.NewFlagSet("lint", flag.ContinueOnError)
		fs.SetOutput(errw)
		root := fs.String("root", ".", "ゲームのリポジトリの場所")
		strict := fs.Bool("strict", false, "警告も 失敗にする")
		if fs.Parse(args[1:]) != nil {
			return 2
		}
		is := Lint(*root)
		sort.SliceStable(is, func(i, j int) bool { return is[i].Level < is[j].Level })
		ng, w := 0, 0
		for _, i := range is {
			fmt.Fprintf(out, "%s: %s\n", i.Level, i.Msg)
			if i.Level == "NG" {
				ng++
			} else {
				w++
			}
		}
		if ng > 0 || (*strict && w > 0) {
			fmt.Fprintf(out, "\n結果: NG %d 件 ／ 警告 %d 件\n", ng, w)
			return 1
		}
		fmt.Fprintf(out, "OK（NG 0 件 ／ 警告 %d 件）\n", w)
		return 0
	case "serve":
		fs := flag.NewFlagSet("serve", flag.ContinueOnError)
		fs.SetOutput(errw)
		root := fs.String("root", ".", "配るフォルダ")
		addr := fs.String("addr", "127.0.0.1:8098", "待ちうけるアドレス")
		lan := fs.Bool("lan", false, "同じ Wi-Fi の ほかの機器にも 配る（0.0.0.0）")
		if fs.Parse(args[1:]) != nil {
			return 2
		}
		if st, err := os.Stat(*root); err != nil || !st.IsDir() {
			fmt.Fprintf(errw, "フォルダがありません: %s\n", *root)
			return 2
		}
		a := *addr
		if *lan {
			if _, p, err := net.SplitHostPort(a); err == nil {
				a = net.JoinHostPort("0.0.0.0", p)
			} else {
				a = "0.0.0.0:8098"
			}
		}
		ln, err := net.Listen("tcp", a)
		if err != nil {
			fmt.Fprintf(errw, "待ちうけできません: %v\n", err)
			return 1
		}
		srv := &http.Server{Handler: NewHandler(*root), ReadHeaderTimeout: 10 * time.Second, IdleTimeout: 60 * time.Second}
		fmt.Fprintf(out, "ARE ゲームを配っています（止めるには Ctrl+C）\n")
		printURLs(ln.Addr().String(), *lan)
		go func() {
			c := make(chan os.Signal, 1)
			signal.Notify(c, os.Interrupt)
			<-c
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			defer cancel()
			_ = srv.Shutdown(ctx)
		}()
		if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
			fmt.Fprintf(errw, "サーバーのエラー: %v\n", err)
			return 1
		}
		return 0
	case "version", "-v", "--version":
		fmt.Fprintln(out, "aregames", version)
		return 0
	default:
		usage(errw)
		return 2
	}
}

func usage(w *os.File) {
	fmt.Fprintln(w, "使いかた: aregames lint [-root DIR] [-strict] | aregames serve [-root DIR] [-addr ADDR] [-lan] | aregames version")
}

func lanIPs() []string {
	var r []string
	ifs, _ := net.InterfaceAddrs()
	for _, a := range ifs {
		if ipn, ok := a.(*net.IPNet); ok && !ipn.IP.IsLoopback() && ipn.IP.To4() != nil {
			r = append(r, ipn.IP.String())
		}
	}
	return r
}
