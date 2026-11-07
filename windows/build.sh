#!/usr/bin/env bash
# Build the Windows installer (IslandTime-Setup.exe) from any OS with Go 1.21+ and Python 3 + Pillow.
# No Windows machine, Wine, NSIS or admin rights needed.
set -euo pipefail
cd "$(dirname "$0")"
python3 mkicon.py                                  # -> icon.ico / icon.png
python3 mksyso.py icon.ico launcher/rsrc_windows_amd64.syso   # icon + DPI manifest
cp launcher/rsrc_windows_amd64.syso setup/
mkdir -p setup/payload dist
(cd launcher && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o ../setup/payload/IslandTime.exe .)
cp ../index.html setup/payload/index.html
cp ../fonts/fraunces-latin-600-normal.woff2 setup/payload/
cp icon.ico setup/payload/
(cd setup && GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o ../dist/IslandTime-Setup.exe .)
echo "Built windows/dist/IslandTime-Setup.exe"
