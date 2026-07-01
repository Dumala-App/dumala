# Phase 1 Offline Device Validation

Updated: 2026-06-23

## Purpose

This checklist is the deferred hardware evidence record for Phase 1. Automated Chromium verification covers production caching, offline cold launch, offline refresh, seeded workspace persistence, and navigation through every core coaching area. Real-device rows remain useful production evidence because Safari installation, mobile operating-system storage policies, and installed-app lifecycle behavior cannot be represented faithfully by desktop automation, but they are no longer blocking Phase 2.

Production URL: `https://dumala.asia`

Decision: skipped as a Phase 1 blocker on 2026-06-23 so Phase 2 mobile/tablet work can proceed. Keep this record for a later production hardware pass.

## Automated baseline

Run before and after every physical-device session:

```bash
npm run lint
npm test
npm run clean
npm run build
npm run verify:pwa
```

The offline verifier must confirm:

- production service worker activation;
- cold launch and refresh with the network disabled;
- persisted V3 player and staff records;
- Overview, Bulletins, and Game Week;
- Squad and staff directory;
- Tactics;
- Training and Assessments;
- League and Updates;
- a bulletin created offline and preserved after refresh;
- visible offline status.

## Device matrix

| Device | OS | Browser / install method | Install | Offline cold launch | Offline refresh | Core workflows | Controlled update | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop 1 | | Chrome or Edge install | [x] | [ ] | [ ] | [ ] | [ ] | Install confirmed by user |
| Android phone | | Chrome install | [x] | [ ] | [ ] | [ ] | [ ] | Install confirmed by user |
| Android tablet | | Chrome install | [x] | [ ] | [ ] | [ ] | [ ] | Install confirmed by user |
| iPhone | | Safari Add to Home Screen | [ ] | [ ] | [ ] | [ ] | [ ] | Pending |
| iPad | | Safari Add to Home Screen | [ ] | [ ] | [ ] | [ ] | [ ] | Pending |

## Validation log

| Date | Environment | Coverage | Evidence | Result |
| --- | --- | --- | --- | --- |
| 2026-06-23 | Local Chromium automation | Production service worker, offline cold launch, offline refresh, V3 player/staff persistence, core workflow traversal, offline bulletin persistence | `npm run verify:pwa` | Passed |
| 2026-06-23 | Local quality gates | TypeScript, unit tests, clean production build | `npm run lint`, `npm test`, `npm run clean`, `npm run build` | Passed |
| 2026-06-23 | Physical desktop, Android phone, Android tablet | Installed app presence | User confirmed installation | Install passed; offline checks pending |
| 2026-06-23 | Physical desktop | Installed Chrome or Edge app lifecycle, OS-level offline launch, refresh, controlled update | Physical device run required | Pending |
| 2026-06-23 | Physical Android phone/tablet | Chrome install lifecycle, Android storage policy, offline launch, refresh, controlled update | Physical device run required | Pending |
| 2026-06-23 | Physical iPhone/iPad | Safari Add to Home Screen lifecycle, iOS/iPadOS storage policy, offline launch, relaunch, controlled update | Physical device run required | Pending |

## Evidence requirements

Record the following for each physical-device row:

- device model and OS version;
- browser version and install method;
- production app URL and app version or commit under test;
- old commit and new commit for controlled-update checks;
- pass/fail result for install, cold launch, refresh, core workflows, local persistence, reconnect, and controlled update;
- notes for any data loss, browser prompt, storage warning, reload loop, or unexpected recovery screen.

## Per-device procedure

1. Open production online and create or restore a disposable test workspace.
2. Install Dumala using the platform-supported method.
3. Open every primary area once while online.
4. Close the installed app completely.
5. Disable Wi-Fi and mobile data.
6. Cold-launch the installed app and confirm the offline banner.
7. Open Bulletins, Game Week, Squad, Tactics, Training, Assessments, League, and Updates.
8. Make one harmless local edit, close the app, reopen it offline, and confirm persistence.
9. Refresh or relaunch while still offline.
10. Reconnect and confirm the connection-restored message.

## Controlled-update procedure

1. Keep the installed production app open on the previous release.
2. Deploy a harmless visible release marker through protected `main`.
3. Reopen or focus the old app online until the update prompt appears.
4. Choose **Later** and confirm the current session remains usable.
5. Reopen the update prompt, choose **Update now**, and confirm one controlled reload.
6. Confirm the workspace, player/staff separation, and local edit remain intact.
7. Record the old commit, new commit, device, browser, and result.

## Completion rule

Phase 1 is complete when every required device row passes without unexpected data loss. A device-specific failure must be documented, fixed, and rerun before the roadmap is marked 100%.
