# AutoSkippy Handoff

## Purpose

Browser extension that auto-clicks skip buttons (intro, recap, ads, next episode) on streaming platforms. Single MV3 codebase shipped to both Chrome Web Store and Firefox Add-ons.

## Status

| Phase | Status |
|---|---|
| 3.1.0 review-fixes branch | In progress on `fix/3.1.0-review-fixes` |
| Live verification | Pending user testing on real streaming pages |
| Chrome + Firefox release | Pending verification + store submission |

## Pinned technical decisions

- **Per-browser manifests:** `code/manifest.json` is the Firefox variant (keeps `browser_specific_settings.gecko.id`); `code/manifest.chrome.json` is identical minus gecko. Chrome ignores unknown manifest keys with a warning, but we ship clean per-store manifests.
- **Build:** `./build.sh [chrome|firefox|all]` produces `build/autoskippy-<browser>-<version>.zip`. Keep both manifests' `version` and `matches` in sync by hand.
- **Anti-loop:** every skip click goes through `clickOnce()`, which marks the DOM element with `data-autoskippy-clicked` and clears the mark after 15s. Marking the element (not a JS variable) survives re-injection of `script.js`; the 15s timeout breaks the click loop while still allowing DOM-node reuse for later ads.
- **Re-injection safety:** `script.js` is injected via the manifest AND manually from `popup.js` on toggle-on. Guarded by: no top-level `let`/`const`, a cleanup IIFE that clears the old interval, and `window.autoSkippyListenerAdded` so the storage listener doesn't stack.
- **`chrome.scripting.executeScript` uses `func:`** (not `function:`) for inline functions. The old `function:` key was silently ignored, breaking toggle-off.

## Supported platforms and selectors

| Platform | Hosts | Feature selectors |
|---|---|---|
| Netflix | netflix.com | `button[data-uia="player-skip-intro"]`, `player-skip-recap`, `next-episode-seamless-button` |
| YouTube | youtube.com | `.ytp-ad-skip-button-modern`, `.ytp-ad-skip-button`, `.ytp-skip-ad-button`, `.ytp-ad-overlay-close-button` |
| Prime Video | primevideo.com + amazon.* TLDs (see manifest) | `.atvwebplayersdk-skipelement-button`, `button[class*='skipelement']`, `[class*='skipelement'] button`; next-up: `.atvwebplayersdk-nextupcard-button`, `button[class*='nextupcard']` (unverified) |
| Crave | crave.ca | `button[aria-label="Skip Intro"/"Skip Recap"/"Play next content"]` |
| Disney+ | disneyplus.com | `.skip__button`, `button[class*='skip__button']`; next: `button[aria-label*='next episode' i]` (countdown label, must match substring) |

## Gotchas

- Disney's next-episode `aria-label` is a countdown (`"NEXT EPISODE IN 8"`), so exact matching never works; use case-insensitive substring or a `data-testid` found in live DOM.
- Prime viewers on `amazon.com/gp/video` and regional TLDs run the same atv web player SDK; the manifest enumerates ~15 amazon TLDs (wildcard TLDs aren't allowed in match patterns). Adding hosts counts as widened host permissions in store review.
- `index.html` footer version is hardcoded; bump it with the manifest version.
- No tests or CI; all verification is manual on live sites.
- Em dashes are banned in shipped copy/comments (global rule).

## Pending work

- **PR #4** (`arpitdalal:feat/mute-netflix-ads`): changes requested 2026-10-27 (re-injection `SyntaxError` from top-level `let`, state-restore issues). Awaiting contributor; can ride into 3.1.0 if it lands.
- **Deferred platform requests:** Shudder, Channel4, ITVX, YouTube in-video intro/sponsor segments (needs SponsorBlock-style data). All need live-DOM selector research before implementation.

## Next step

User live-tests the branch per the verification checklist (Prime on both domains, Disney next-episode, loop test, toggle-off, re-injection), adjusts selectors if live DOM differs, then approves commits and store submission.
