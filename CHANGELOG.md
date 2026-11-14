# Changelog

Release notes for Island Time. `/releasenow` adds a section here for every release, and the GitHub release
notes are taken from it. Earlier versions are listed in the game's What's new screen (`src/js/83-whats-new.js`).

## Unreleased

### Changed
- Releases now go through the shared Krazow release kit: `/releasenow` publishes a beta at `/beta/` first, then
  `/releasenow promote` puts it live. Pushing to `main` no longer changes the live game.
- New: an Android app (APK) with every release.
- The service worker only clears Island Time's own caches.
