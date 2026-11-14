// Island Time setup: per-user installer (no admin needed).
package main

import (
	_ "embed"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

//go:embed payload/IslandTime.exe
var launcherExe []byte

//go:embed payload/index.html
var gameHTML []byte

//go:embed payload/icon.ico
var iconICO []byte

//go:embed payload/fraunces-latin-600-normal.woff2
var fontWOFF2 []byte

const appName = "Island Time Setup"
var version = "dev" // set by windows/build.sh: -ldflags "-X main.version=<APP_VERSION>"

var msgBox = syscall.NewLazyDLL("user32.dll").NewProc("MessageBoxW")

var box = func(text string, flags uintptr) int {
	t, _ := syscall.UTF16PtrFromString(text)
	c, _ := syscall.UTF16PtrFromString(appName)
	r, _, _ := msgBox.Call(0, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), flags)
	return int(r)
}

func psQuote(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }

func runPS(script string) error {
	codes := syscall.StringToUTF16(script)
	b := make([]byte, 0, len(codes)*2)
	for _, c := range codes[:len(codes)-1] {
		b = append(b, byte(c), byte(c>>8))
	}
	cmd := exec.Command("powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", b64(b))
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
	return cmd.Run()
}

func b64(b []byte) string {
	const tbl = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
	var sb strings.Builder
	for i := 0; i < len(b); i += 3 {
		rem := len(b) - i
		n := uint32(b[i]) << 16
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

func main() {
	// --quiet: an update started by the launcher (windows/launcher/update.go). No questions, no "Play now"; it waits for
	// the launcher to let go of IslandTime.exe, and says nothing if it can't finish (the old copy keeps working).
	quiet := false
	for _, a := range os.Args[1:] {
		if strings.EqualFold(a, "--quiet") {
			quiet = true
		}
	}
	if quiet {
		box = func(string, uintptr) int { return 6 }
	}
	if !quiet && box("Install Island Time "+version+"?\n\nA week of living on Anderson Island, WA: ferries, breakdowns, groceries, trading, and no gas on the island.\n\nIt installs for your user account only (no admin needed) and adds Start menu and desktop shortcuts.", 0x4|0x40) != 6 {
		return
	}
	la := os.Getenv("LOCALAPPDATA")
	if la == "" {
		box("Couldn't find your AppData folder.", 0x10)
		return
	}
	dir := filepath.Join(la, "Programs", "IslandTime")
	exe := filepath.Join(dir, "IslandTime.exe")
	ico := filepath.Join(dir, "icon.ico")
	files := map[string][]byte{
		exe:                                      launcherExe,
		ico:                                      iconICO,
		filepath.Join(dir, "game", "index.html"): gameHTML,
		filepath.Join(dir, "game", "fonts", "fraunces-latin-600-normal.woff2"): fontWOFF2,
		filepath.Join(dir, "game", "version.txt"):                              []byte(version + "\n"),
	}
	for p, data := range files {
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			box("Install failed: "+err.Error(), 0x10)
			return
		}
		var err error
		for try := 0; try < 30; try++ { // in an update the launcher may still be closing
			if err = os.WriteFile(p, data, 0o755); err == nil || !quiet {
				break
			}
			time.Sleep(500 * time.Millisecond)
		}
		if err != nil {
			box("Install failed (is Island Time running? Close it and try again):\n"+err.Error(), 0x10)
			return
		}
	}
	size := (len(launcherExe) + len(gameHTML) + len(iconICO) + len(fontWOFF2)) / 1024
	reg := `HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\IslandTime`
	script := fmt.Sprintf(`$ErrorActionPreference='Stop'
$s=New-Object -ComObject WScript.Shell
foreach($f in @([Environment]::GetFolderPath('Programs'),[Environment]::GetFolderPath('Desktop'))){
  $l=$s.CreateShortcut((Join-Path $f 'Island Time.lnk'))
  $l.TargetPath=%[1]s; $l.WorkingDirectory=%[2]s; $l.IconLocation=%[3]s+',0'
  $l.Description='Island Time: an Anderson Island ferry game'; $l.Save()
}
$k=%[4]s
New-Item -Path $k -Force | Out-Null
New-ItemProperty -Path $k -Name DisplayName -Value 'Island Time' -PropertyType String -Force | Out-Null
New-ItemProperty -Path $k -Name DisplayVersion -Value %[5]s -PropertyType String -Force | Out-Null
New-ItemProperty -Path $k -Name Publisher -Value 'Island Time' -PropertyType String -Force | Out-Null
New-ItemProperty -Path $k -Name DisplayIcon -Value %[3]s -PropertyType String -Force | Out-Null
New-ItemProperty -Path $k -Name InstallLocation -Value %[2]s -PropertyType String -Force | Out-Null
New-ItemProperty -Path $k -Name UninstallString -Value %[6]s -PropertyType String -Force | Out-Null
New-ItemProperty -Path $k -Name NoModify -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $k -Name NoRepair -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $k -Name EstimatedSize -Value %[7]d -PropertyType DWord -Force | Out-Null`,
		psQuote(exe), psQuote(dir), psQuote(ico), psQuote(reg), psQuote(version), psQuote(`"`+exe+`" --uninstall`), size)
	if err := runPS(script); err != nil {
		box("Island Time was installed to:\n"+dir+"\n\nbut the shortcuts couldn't be created. You can start the game by running IslandTime.exe in that folder.", 0x30)
	}
	if quiet {
		return
	}
	if box("Island Time is installed!\n\nYou'll find it in the Start menu and on your desktop. To remove it, use Settings > Apps.\n\nPlay now?", 0x4|0x40) == 6 {
		exec.Command(exe).Start()
	}
}
