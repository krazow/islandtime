// Island Time launcher: opens the game in its own app window (Edge/Chrome app mode).
package main

import (
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

const appName = "Island Time"
const regKey = `HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\IslandTime`

var user32 = syscall.NewLazyDLL("user32.dll")
var msgBox = user32.NewProc("MessageBoxW")

func box(text string, flags uintptr) int {
	t, _ := syscall.UTF16PtrFromString(text)
	c, _ := syscall.UTF16PtrFromString(appName)
	r, _, _ := msgBox.Call(0, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), flags)
	return int(r)
}

func hidden(cmd *exec.Cmd) *exec.Cmd {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
	return cmd
}

func findBrowser() string {
	var roots []string
	for _, e := range []string{"ProgramFiles(x86)", "ProgramFiles", "LOCALAPPDATA"} {
		if v := os.Getenv(e); v != "" {
			roots = append(roots, v)
		}
	}
	rel := []string{
		`Microsoft\Edge\Application\msedge.exe`,
		`Google\Chrome\Application\chrome.exe`,
		`BraveSoftware\Brave-Browser\Application\brave.exe`,
	}
	for _, r := range rel {
		for _, root := range roots {
			p := filepath.Join(root, r)
			if _, err := os.Stat(p); err == nil {
				return p
			}
		}
	}
	return ""
}

func psQuote(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }

func runPS(script string) error {
	u := utf16le(script)
	return hidden(exec.Command("powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", u)).Run()
}

func utf16le(s string) string {
	codes := syscall.StringToUTF16(s)
	b := make([]byte, 0, len(codes)*2)
	for _, c := range codes[:len(codes)-1] {
		b = append(b, byte(c), byte(c>>8))
	}
	return b64(b)
}

func b64(b []byte) string {
	const tbl = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
	var sb strings.Builder
	for i := 0; i < len(b); i += 3 {
		var n uint32
		rem := len(b) - i
		n = uint32(b[i]) << 16
		if rem > 1 {
			n |= uint32(b[i+1]) << 8
		}
		if rem > 2 {
			n |= uint32(b[i+2])
		}
		sb.WriteByte(tbl[n>>18&63])
		sb.WriteByte(tbl[n>>12&63])
		if rem > 1 {
			sb.WriteByte(tbl[n>>6&63])
		} else {
			sb.WriteByte('=')
		}
		if rem > 2 {
			sb.WriteByte(tbl[n&63])
		} else {
			sb.WriteByte('=')
		}
	}
	return sb.String()
}

func uninstall(dir string) {
	if box("Remove Island Time from this computer?", 0x4|0x20) != 6 {
		return
	}
	runPS(`$ErrorActionPreference='SilentlyContinue'
foreach($f in @([Environment]::GetFolderPath('Desktop'),[Environment]::GetFolderPath('Programs'))){ Remove-Item -LiteralPath (Join-Path $f 'Island Time.lnk') -Force }
Remove-Item -LiteralPath ` + psQuote(regKey) + ` -Recurse -Force`)
	if la := os.Getenv("LOCALAPPDATA"); la != "" {
		os.RemoveAll(filepath.Join(la, "IslandTime"))
	}
	box("Island Time has been removed. Safe travels off the island.", 0x40)
	cmd := exec.Command("cmd.exe")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000,
		CmdLine: `/c ping -n 3 127.0.0.1 >nul & rmdir /s /q "` + dir + `"`}
	cmd.Dir = os.TempDir()
	cmd.Start()
}

func main() {
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)
	for _, a := range os.Args[1:] {
		if strings.EqualFold(a, "--uninstall") {
			uninstall(dir)
			return
		}
	}
	page := filepath.Join(dir, "game", "index.html")
	if _, err := os.Stat(page); err != nil {
		box("The game files are missing. Please run the Island Time installer again.", 0x10)
		return
	}
	// ?app=win tells the game it is the Windows app: online, it moves on to the live website (src/js/87-update.js)
	u := (&url.URL{Scheme: "file", Path: "/" + filepath.ToSlash(page), RawQuery: "app=win"}).String()
	if b := findBrowser(); b != "" {
		profile := filepath.Join(os.Getenv("LOCALAPPDATA"), "IslandTime", "profile")
		os.MkdirAll(profile, 0o755)
		cmd := exec.Command(b, "--app="+u, "--user-data-dir="+profile, "--window-size=500,940",
			"--no-first-run", "--no-default-browser-check", "--disable-features=Translate")
		if cmd.Start() == nil {
			selfUpdate(dir) // keep the offline copy current; runs while the game is open, then the launcher exits
			return
		}
	}
	// Fallback: default browser
	hidden(exec.Command("rundll32.exe", "url.dll,FileProtocolHandler", page)).Start()
}
