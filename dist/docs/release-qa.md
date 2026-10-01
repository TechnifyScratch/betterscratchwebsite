# Verification and release checklist · 0.2.0

## Automated checks

Resume verification (2026-09-29): `npm run package` passed ESLint, all 46 tests across nine files, TypeScript, production builds and the compiled injection smoke test. The 0.2.0 ZIP was regenerated. The settings preview was reopened and visually checked at a 626 px viewport with no document horizontal overflow; full mobile and live extension QA remain pending. Current screenshot: `docs/workbench-preview.png`.

Run `npm run check`: ESLint, Vitest, strict TypeScript, both Vite builds, then the compiled-bundle smoke test.

The smoke test uses a deliberately minimal Scratch-shaped fixture in jsdom. It executes the **actual built content.js**, verifies widget/sidebar injection, repeated mutations without duplication, preserved native DOM identity and click handlers, live settings changes, Hidden mode, master disable, editor DOM entry/exit and SPA URL entry into the editor. This proves lifecycle behavior under the fixture, not browser styling or Scratch compatibility.

Unit/UI tests cover preferences defaults, persistence, per-key merges, storage errors, listener cleanup, import validation, route and editor detection, identity boundaries, registry mounting/cleanup, popup power/theme controls, widget mode selection, distraction-free cleanup, filter clearing, bounded history and banner validation.

## Manual checks performed

- Ran the actual public-data service against live public Scratch endpoints: statistics for viralgoose and follower eligibility for griffpatch. No cookies, credentials or Scratch writes.
- Reviewed the redesigned dark workbench and verification settings in the in-app browser. A 390 px viewport override did not take effect in that browser, so mobile visual QA remains pending.
- Inspected the live native Search results DOM and corrected filtering/styling to use `#projectBox .grid`.

- Viewed the real logged-out Scratch homepage; checked the navigation and card markup used by the adapters.
- Navigated native Explore → Studios and confirmed the destination.
- Inspected one live public project: `.preview > .inner`, `.guiPlayer`, and `.project-title` matched; editor markers were absent. Clicked native See inside without editing: the URL changed to `/editor/`, the editor marker appeared and `.guiPlayer` disappeared. This checked detection only, with no extension installed.
- Viewed the extension settings preview in a real in-app browser. Checked light/dark rendering and theme interaction. Preview preferences are isolated browser localStorage, not Chrome sync.
- No Scratch account login, edits, comments, shares or management actions performed.

## Still required before distribution

1. Load `dist/` in current stable Chrome. Check the extension's Errors panel and service-worker console; open popup and settings with no CSP/resource errors.
2. Approve the new api.scratch.mit.edu host permission when updating from 0.1.0. On Scratch, test logged out and logged in. Confirm native Create, Explore, Ideas, search, account menu, login/logout, messages and My Stuff work. Settings must open in a new tab and leave the Scratch tab unchanged.
3. Home: verify original featured/community sections, native intro/notices, carousel controls and links. Check all widget modes/heights, custom image upload/removal, sidebar collapse, mobile widths and reload persistence. Verify history-off does not write visits.
4. Project: flag, stop, fullscreen, key input, pointer coordinates and audio; instructions, comments, report, remix, love/favorite and studio actions. Toggle distraction-free off/on and then disable the feature. Do not perform public writes without a test account and intent.
5. Click See inside without reloading. Confirm all BetterScratch hosts and root attributes disappear. Exercise block dragging, stage, sprite/costume/sound editing, keyboard shortcuts, saving and project execution. Return to project view and verify remount.
6. My Stuff: test loaded title filtering, clearing and new rows; original edit/share/delete and pagination remain accessible. Test density. Confirm no order/metadata is fabricated.
7. Profiles/studios/messages: keyboard navigation, following/commenting/curating/management permissions, pagination and nested menus. Verify native error and moderation messages remain visible.
8. Test Light/Dark/System, OS theme change, reduced motion, 200% zoom, narrow layouts, keyboard-only operation, high contrast and screen readers. Check both native and extension UI.
9. Storage: reload browser, terminate/restart service worker, two tabs, sync errors/quota, import invalid files, reset and clear history. Confirm reset does not remove uploaded banner/history unexpectedly.
10. Disable BetterScratch while a mode/filter is active. Native DOM, controls, styles and visibility must restore without a reload. Repeat with browser Back/Forward and a second extension that also styles Scratch.

11. Verify community/staff/follower badges in cards, comments, profile headings and account menus; hover/read the reason. Exactly 1,000 followers must not qualify. API failure and public-data opt-out must not create new automatic badges. Explicit community selections should still work with API off.
12. Verify Statistics coverage labels and timestamps, cache expiry/clear, API 429 handling, and stopping queued requests after opt-out. Confirm that engagement from 40-project samples is never shown as lifetime totals.
13. Save/remove project shelf entries across two tabs and the workbench; disable project tools while keeping shelf enabled, and vice versa. Confirm no Scratch favorite/share/write request occurs.

Do not call the release fully functional based on screenshots, these fixtures or source inspection alone.
