# Changelog

Release notes for Island Time. `/release now` adds a section here for every release, and the GitHub release
notes are taken from it. Earlier versions are listed in the game's What's new screen (`src/js/83-whats-new.js`).

## 1.25.1 (2026-11-18)

### Added
- A ✉️ Send button in the feedback form (⚙️ Settings → 💬 Send feedback, and the end screen): the note, its kind, the
  game summary and an optional email for a reply go straight to the developer through Formspree, with no GitHub
  account needed. Open a GitHub issue and Copy report still work.
- A beta for testers at https://krazow.github.io/islandtime/beta/, with its own saved games so testers' real games are
  never touched. It's also in the What's new screen.

### Changed
- Releases now go through the shared Krazow release kit: `/release now` publishes a beta at `/beta/` first, then
  `/release promote` puts it live. Pushing to `main` no longer changes the live game.
- The service worker only clears Island Time's own caches.
