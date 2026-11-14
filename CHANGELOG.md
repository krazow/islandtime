# Changelog

Release notes for Island Time. `/releasenow` adds a section here for every release, and the GitHub release
notes are taken from it. Earlier versions are listed in the game's What's new screen (`src/js/83-whats-new.js`).

## 1.25.1 (2026-11-14)

### Added
- An Android app (APK) with every release, alongside the Windows installer, the offline file and the web zip.
- A beta for testers at https://krazow.github.io/islandtime/beta/, with its own saved games so testers' real games are
  never touched. It's also in the What's new screen.

### Changed
- Releases now go through the shared Krazow release kit: `/releasenow` publishes a beta at `/beta/` first, then
  `/releasenow promote` puts it live. Pushing to `main` no longer changes the live game.
- New: an Android app (APK) with every release.
- The service worker only clears Island Time's own caches.
