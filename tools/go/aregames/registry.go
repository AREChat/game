package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// Registry は shared/games-registry.json の形（ゲーム一覧の元データ）。
type Registry struct {
	Schema int      `json:"schema"`
	Langs  []string `json:"langs"`
	Genres []Genre  `json:"genres"`
	Games  []Game   `json:"games"`
}

type Genre struct {
	ID    string              `json:"id"`
	Emoji string              `json:"emoji"`
	C1    string              `json:"c1"`
	C2    string              `json:"c2"`
	Name  map[string]string   `json:"name"`
	Blurb map[string]string   `json:"blurb"`
	Tips  map[string][]string `json:"tips"`
}

type Game struct {
	ID          string              `json:"id"`
	Genre       string              `json:"genre"`
	Folder      string              `json:"folder"`
	Href        string              `json:"href"`
	Ext         bool                `json:"ext"`
	Multi       bool                `json:"multi"`
	Emoji       string              `json:"emoji"`
	C1          string              `json:"c1"`
	C2          string              `json:"c2"`
	Img         string              `json:"img"`
	Order       int                 `json:"order"`
	IsNew       bool                `json:"isNew"`
	Adult       bool                `json:"adult"`
	Gamepad     bool                `json:"gamepad"`
	InGameLangs []string            `json:"inGameLangs"`
	Name        map[string]string   `json:"name"`
	Sub         map[string]string   `json:"sub"`
	Desc        map[string]string   `json:"desc"`
	Tags        map[string][]string `json:"tags"`
}

func loadRegistry(root string) (*Registry, []byte, error) {
	p := filepath.Join(root, "shared", "games-registry.json")
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, nil, fmt.Errorf("一覧が読めません: %w", err)
	}
	var r Registry
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&r); err != nil {
		return nil, b, fmt.Errorf("一覧の形がちがいます: %w", err)
	}
	return &r, b, nil
}
