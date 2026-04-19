# Remove manual reveal toggle (keep auto-reveal only)

**Date:** 2026-04-19
**Status:** Draft — pending review

## Background

Grape nights (Drueaften) currently support two ways to trigger the reveal of each pair's wine + dish choices:

1. **Scheduled reveal** — admin sets `revealTime`; reveal happens automatically when `now >= date + revealTime`.
2. **Manual reveal** — admin toggles `revealed: boolean` via a button in `GrapeNightView` or a confirmation-gated button in `GrapeSetup`.

The combination produces a three-state `isRevealed` expression in `GrapeNightView.svelte:49–51`:

```ts
night.revealed === true || (night.revealed !== false && scheduledReveal)
```

- `revealed === true` → force show
- `revealed === false` → force hide, overriding schedule
- `revealed` absent → follow schedule

This three-state logic is the main source of complexity and is scattered across two components plus the `updateNight` allowed-keys list. The app owner prefers auto-reveal in practice and wants to remove the manual toggle.

## Goal

Reveal is controlled **only** by `revealTime` + `date`. Remove the `revealed` field, the manual toggle UIs, and the related confirmation state. Require `revealTime` at setup time so a night cannot silently fail to reveal.

## Non-goals

- No changes to the reveal *behavior* on pair cards (`GrapePairCard` keeps its `isRevealed` prop).
- No changes to wine nights (`hidePersonField`, rating, etc.).
- No changes to admin mode (`?admin`), pair setup, grape assignments, participants, or registration form.
- No data migration beyond ignoring `night.revealed` on old records.

## Scope of changes

### 1. Data model (`src/lib/firebase.ts`)

- Remove `revealed?: boolean` from the `WineNight` type (currently line 66).
- Remove `"revealed"` from the `updateNight` allowed-keys tuple (currently line 77).

Old Firebase records may still carry a `revealed` field. After this change the value is simply ignored on read; no migration or cleanup job is required. This is safe because:

- Past grape nights are typically marked `completed` and not re-visited.
- Any still-active night where `revealed: true` was set will fall back to its scheduled reveal. Since scheduled reveal is now required at setup, affected nights already have a `revealTime`, and they will reveal at that time instead of instantly. Acceptable: the scheduled time was the intended reveal moment.
- Any still-active night with `revealed: false` no longer forces-hide; schedule governs. Also acceptable — forcing-hide past a scheduled reveal was always a niche override.

### 2. `src/lib/components/GrapeNightView.svelte`

- Collapse `isRevealed` (lines 46–51) to just the schedule:

  ```ts
  let isRevealed = $derived.by(() => {
      if (!night.revealTime || !night.date) return false;
      const revealAt = new Date(`${night.date}T${night.revealTime}`);
      return now >= revealAt;
  });
  ```

  The separate `scheduledReveal` derived is no longer needed; merge it into `isRevealed`. Keep the `now` state and the 30-second `setInterval` tick.
- Remove the admin reveal toggle button (lines ~93–129) — the `<button>` that calls `updateNight(nightId, { revealed: !isRevealed })`.
- Keep the "Endre oppsett" / "Skjul oppsett" toggle (lines ~131–146) — separate feature.
- The wrapping `{#if isAdmin}` block (lines ~90–152) still holds the setup-toggle; it stays but loses its first button.
- All other references to `isRevealed` (lines 277, 325, 337, 350) remain correct — the derived now means "has the scheduled moment passed."

### 3. `src/lib/components/GrapeSetup.svelte`

- Remove `let isRevealed = $derived(night.revealed === true);` (line 19).
- Remove `let confirmReveal = $state(false);` (line 65).
- Remove the "Manual override" block (lines ~565–609): the "Avsløre nå" button, the confirmation prompt, and the "Vin og rett er synlig for alle" display.
- Keep the "Avsløres automatisk" time-input row (lines ~541–563).
- Update the surrounding `<section>` so the reveal-time row stands alone as the only reveal control.

### 4. Require `revealTime` at setup completion

`GrapeNightView.svelte:68` currently determines setup completeness as:

```ts
let isSetupComplete = $derived(pairs.length > 0 && hasAssignments);
```

Extend the check to include `revealTime`:

```ts
let isSetupComplete = $derived(
    pairs.length > 0 && hasAssignments && !!night.revealTime
);
```

Effect: if pairs + grape assignments exist but `revealTime` is empty, the night stays in the setup phase. Admins see the `GrapeSetup` view with the time input waiting for a value.

**UX polish in `GrapeSetup.svelte`:** when `pairs.length > 0 && hasAssignments && !night.revealTime`, surface a subtle hint near the time-input row (e.g., the existing row's subtitle gains an `"Sett et klokkeslett for å fullføre oppsettet"` note, or the row border becomes `border-wine-light`). Implementation detail for the plan; the spec just requires that the admin is not left wondering why setup isn't "done."

## Behavior after change

**Happy path.** Admin creates grape night → sets date → adds participants → creates pairs → assigns grapes → sets `revealTime`. Setup completes. Pairs register their wine + dish. At the scheduled moment, the 30-second tick flips `isRevealed` to true and `GrapePairCard` reveals the wine + dish for every pair.

**Reveal early.** Admin edits `revealTime` in the setup UI to the current time (or earlier). On the next tick (≤30 s) the reveal fires. Admin can re-open setup with "Endre oppsett" if the night has already moved past the setup phase. Acceptable trade-off: one extra step compared to a single-click toggle, in exchange for removing the three-state logic.

**Reveal late / hide again.** Not supported. Once `revealTime` has passed, the state is "revealed." To hide again, the admin would have to edit `revealTime` to a future moment. The clock tick would then flip `isRevealed` back to false on the next tick. This is a side-effect, not a designed feature; the UI does not advertise it.

**Missing `revealTime`.** Impossible on a completed setup: `isSetupComplete` gates on it. For old nights where participants/pairs/grapes already exist but `revealTime` is empty, the night falls back to the setup view on next load, prompting the admin to fill it in.

## Testing

No automated test suite is configured. Manual verification checklist (to live in the implementation plan, not here):

1. Create a new grape night, set a reveal time 1 minute in the future, complete setup, register a pair, wait for reveal.
2. Open an existing grape night where `revealed: true` was previously persisted: confirm the reveal state is now governed by schedule (may need to adjust `revealTime` to test).
3. Open an existing grape night where pairs + grapes exist but `revealTime` is empty: confirm the setup view re-appears and the time input is visible.
4. As non-admin: confirm no reveal toggle is visible.
5. Run `bun run check` — type errors on `revealed` references should all be resolved.

## Risks

- **Grape nights in flight at deploy time.** If a live grape night has `revealed: true` persisted and a future `revealTime`, users will see the reveal "un-happen" on reload. Unlikely in practice (we do not currently have live sessions). Mitigation: deploy outside of known grape-night hours, or accept the edge case.
- **Admin wants to reveal early, edits `revealTime`, mistypes.** Same failure mode as today when setting `revealTime` generally. No new risk surface.

## Out of scope (for follow-up)

The initial brainstorm surfaced other simplification candidates (admin-mode scattering, wine vs grape route split, leftover-participant handling, restaurant mode). Each is its own spec. This one is deliberately narrow.
