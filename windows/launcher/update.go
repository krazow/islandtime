package main

// Background update of the installed (offline) copy. When online, the game itself moves on to the live website
// (src/js/87-update.js), so this only keeps the copy used offline current: the launcher reads the website's
// version.json and, if it's newer than game\version.txt, downloads the latest installer and runs it with --quiet.
// The quiet installer waits for this launcher to exit, writes the new files over the old ones (saved games live in
// the browser profile, which it never touches) and exits. Nothing is shown unless something is new and it works.

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const site = "https://krazow.github.io/islandtime/"
const installerURL = "https://github.com/krazow/islandtime/releases/latest/download/Island-Time-Setup.exe"

// newer reports whether dotted version a is newer than b ("1.10.0" > "1.9.2"; anything beats "").
func newer(a, b string) bool {
	pa, pb := strings.Split(strings.TrimSpace(a), "."), strings.Split(strings.TrimSpace(b), ".")
	for i := 0; i < len(pa) || i < len(pb); i++ {
		var x, y int
		if i < len(pa) {
			x, _ = strconv.Atoi(pa[i])
		}
		if i < len(pb) {
			y, _ = strconv.Atoi(pb[i])
		}
		if x != y {
			return x > y
		}
	}
	return false
}

func installedVersion(dir string) string {
	b, err := os.ReadFile(filepath.Join(dir, "game", "version.txt"))
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(b))
}

func latestVersion() string {
	c := &http.Client{Timeout: 8 * time.Second}
	r, err := c.Get(site + "version.json?t=" + strconv.FormatInt(time.Now().Unix(), 10))
	if err != nil {
		return ""
	}
	defer r.Body.Close()
	if r.StatusCode != 200 {
		return ""
	}
	var j struct {
		Version string `json:"version"`
	}
	if json.NewDecoder(io.LimitReader(r.Body, 1<<16)).Decode(&j) != nil {
		return ""
	}
	return j.Version
}

// selfUpdate returns once the quiet installer has been started (or there's nothing to do).
func selfUpdate(dir string) {
	lat := latestVersion()
	if lat == "" || !newer(lat, installedVersion(dir)) {
		return
	}
	c := &http.Client{Timeout: 3 * time.Minute}
	r, err := c.Get(installerURL)
	if err != nil {
		return
	}
	defer r.Body.Close()
	if r.StatusCode != 200 {
		return
	}
	f, err := os.CreateTemp("", "Island-Time-Setup-*.exe")
	if err != nil {
		return
	}
	n, err := io.Copy(f, io.LimitReader(r.Body, 200<<20))
	f.Close()
	if err != nil || n < 1<<20 { // a real installer is several MB
		os.Remove(f.Name())
		return
	}
	hidden(exec.Command(f.Name(), "--quiet")).Start()
}
