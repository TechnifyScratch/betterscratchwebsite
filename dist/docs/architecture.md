# Architecture

## Entry points and isolation

`src/background.ts` opens extension settings in a new tab and handles typed public-data/history/shelf messages from this extension only. It validates message kinds, usernames and project IDs. It never requests credentials or sends writes to Scratch.

`src/content/index.ts` gates native styling by page/feature, debounces a child-list observer (160 ms), detects SPA URLs with a cheap 700 ms URL poll, responds to preferences/OS theme, and removes everything on editor entry or master disable. Extension-owned DOM is excluded from observation. No main-world bridge, history monkey-patching or editor key interception.

`src/features/registry.ts` handles independent mount/cleanup/connectivity contracts. Ordinary features fail closed outside known page types; verification is explicitly allowed on other Scratch pages without turning on native-page styling. The editor remains excluded from all features.

React settings and popup are built by Vite with Tailwind and local CSS. Injected React components use separate shadow roots and a self-contained shadow stylesheet. Native page rules use `data-bs-*` gates. Lucide icons are bundled; no CDN, remote executable code or injected Tailwind preflight.

## Public data and verification

`src/background/public-data.ts` constructs requests only to `https://api.scratch.mit.edu`, with validated username paths. It reads basic user data, a follower threshold probe, and bounded project/follower pages. Requests use credentials omission, 10-second timeouts, one-at-a-time scheduling with 300 ms spacing, in-flight deduplication and 429 cooldown. Each queued request rechecks whether public data remains enabled.

Statistics cache for 5 minutes, user/verification snapshots for 1 hour, with at most 300 unexpired cache entries under `bs.publicCache.v1`. No raw bios, comments, credentials or private data are cached. Cache clearing invalidates pending cache writes without bypassing the rate-limit cooldown. Offline failures do not generate verification or fake statistics.

`src/features/verification.ts` recognizes native user-profile links by both destination and username text, plus known profile/account name nodes. It waits for near-viewport visibility before network lookup, shares results by username and cleans up stale badges if a native link is repurposed. A scoped child/href observer handles dynamic content. It creates a small SVG badge using DOM APIs, never interprets profile text as HTML or authority, and never modifies uploaded content.

`src/content/insights.tsx` renders validated results with coverage and timestamps. No full-account engagement total is asserted when the public-project result hits the 40-item cap. The follower threshold is a single `offset=1000&limit=1` read; it is not follower enumeration.

## Useful local tools

`src/shared/shelf.ts`: up to 100 saved project links. Background writes are serialized; keys/links/titles are validated and UI uses React text escaping. Shelf additions/removals are local and independent of Scratch’s own favorites.

`src/features/loaded-filter.tsx`: a shared loaded-title/count control for discovery and My Stuff. It toggles namespaced visibility classes, preserves native node identity and listeners, updates when rows arrive and removes its changes on cleanup. It never reorders Scratch-owned DOM.

`src/shared/settings.ts`: explicit schema, per-key sync writes, safe defaults, import size/schema validation and storage error reporting. Schema 1 is additive: old exports get safe defaults for new features. Default theme is dark; explicit choices remain intact.

`src/shared/local.ts`: independent device-local banner/visit keys. History is opt-in and limited to 20 distinct project-page visits. Background history writes recheck opt-in. It is not an editor/save log.

## Build and permissions

`vite.config.ts` builds settings, popup and the module service worker. `scripts/build-content.mjs` builds one production IIFE for declarative content-script injection. The runtime manifest/assets come from `public/`. `npm run package` runs validation and creates an unpacked-extension ZIP.

Permissions are `storage` plus `https://api.scratch.mit.edu/*` host access. Content-script matching remains `https://scratch.mit.edu/*`, top frame only. There are no cookies, webRequest, broad host, activeTab, scripting or downloads permissions. There is no externally-connectable declaration or remote-code entry point. `chrome.tabs.create` opens extension-owned settings and does not need the `tabs` permission.

## Tests

Offline Vitest tests cover preferences, API shape validation, aggregation coverage, exactly-1,000 vs over-1,000 eligibility, explicit names, staff flag, cache/deduplication/cooldown, opt-out, badge insertion/cleanup, loaded search filtering, shelf behavior and core controls. The jsdom smoke test executes the actual built content bundle. `scripts/check-public-api.mjs` is a separate optional read-only network check, so normal tests remain deterministic.

The homepage sidebar opens an inline dashboard with overview, projects, engagement and saved-project categories. Public username lookups share the background service and its five-minute cache. Ranked project rows use the same bounded 40-project response as aggregates; coverage is shown explicitly. The worker binds native fetch to globalThis before passing it into the service, preserving WorkerGlobalScope receiver requirements.

Inline @mentions and known description/comment-body containers are excluded from verification. Follower activity uses a per-username local baseline and seven-day observed-account events. It is updated on stats reads, labels sampled/partial coverage, and does not infer follow dates from account creation dates.

The extension page opens to public username lookup with overview, project rankings and engagement categories. The popup provides power/theme controls and direct stats, shelf, widget and settings shortcuts. Settings sections retain only operational help and data-limit notes.

Remix counts are loaded from each individual public project endpoint because profile project-list responses can report zero despite existing remixes. Counts share a five-minute per-project cache; failed or malformed lookups remain unavailable while views, loves and favorites still display.

Project tools include a lazy remix tree. Public project metadata supplies parent/original relationships and paginated remix lists supply children. Branch reads share the service cache and rate limits, validate project IDs, filter to direct children, and exclude cycles in the rendered ancestry. Users can expand branches or navigate to the parent/original project within the tree.

The remix tree uses an SVG branch layout with thumbnail nodes growing upward from the glowing original. It opens at the original project automatically; branches expand on demand. Scroll or drag to pan, use zoom controls, and inspect project titles and creators beneath the canvas. Layout omits cycles and unrelated child relationships.

Remix tree links open a separate tab at `https://scratch.mit.edu/{projectId}/remixtree`; `/projects/{projectId}/remixtree` also works. The dedicated feature renders a full-page tree even when Scratch serves its HTML 404 page, and returns to the project through a header control. Disabling the extension or navigating away restores the underlying page.

Visible remix branches now expand and paginate automatically in breadth-first order, using the shared paced API queue. Explicitly collapsed branches stay collapsed; failed branches expose retry. Unmounting the tree stops further discovery.

BetterScratch announcement entries are maintained in `src/shared/announcements.ts` and inserted into the existing Scratch News list with native news-image/news-description markup. No entries ship until requested. Packaged announcement icons are exposed only to Scratch pages; the repository instructions require a user-supplied 500 × 500 px icon for every new announcement. Native Scratch news remains intact.

## Project discovery

The `explore` public-data message accepts only `trending` or `popular`. `PublicDataService.explore` reads a fixed Explore endpoint, projects response fields to id/title/author/views/loves/favorites, drops malformed or duplicate rows, and caches the result for five minutes. `ExploreDashboard` shows request, error/retry, disabled, empty, and loaded states. Sorting stays local to the loaded sample. No country/global user index is maintained.
