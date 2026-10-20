# v0.4 verification — 2026-10-20 UTC

## Automated

- All root `.mjs` modules passed `node --check`.
- `node --test *.test.mjs`: 41/41 passing. Full output is included as `test-results.txt` in the release ZIP.
- Browser-loaded VRM: male/female × standing/crouching × idle/walk/run, 12 combinations. Bone matrices finite and lowest foot bone grounded at 0.105 world units (sole offset). Results bundled as `avatar-browser-check.json`.

## Chromium interaction checks

- 390×844: model loading gates start; seeds 6 and 7 show the two cosmetic variants; full-body real-time mirror; shoulders/sleeves follow arm rig; face not present when looking down in first person.
- 320×568: maintenance supply pickup; inventory; locked management-room panel with four actions visible; 5-second work state; cancel action returns to play and keeps resource cost.
- Keyboard Shift+W: `body[data-running=true]` observed while moving. A-stair action from 2F reached 1F and returned to corridor, not an automatic win.
- Gesture guards are covered by the unit tests. Touch zoom guards and mobile layout were previously exercised in Chromium; this is not an iOS/Safari device certification.
- No application console errors were emitted during the final start/mirror/movement/equipment checks. Transient automation errors (click before asset ready; redeclaring a console variable) were resolved by fresh observation/reload and were not app success claims.

## Important limitations

- Both visual variants derive from one VRM base; they are not separately authored anatomical male/female models.
- First-person rendering excludes the head and near-camera collar/chest geometry, but the mirror renders the complete model. First-person lower-body composition and procedural animation remain prototype quality.
- Equipment is timer/state based; no physically simulated door destruction, water/pressure simulation or real tool manipulation instructions.
- Local HTTP app returned 200. Azents service is On, but an unauthenticated external request returned `401 {"code":"unauthenticated"}`. Authenticated end-user access is not verified, and this is not a public anonymous deployment.
- No actual iPhone/Android/Safari device testing or long-duration performance testing was performed.
