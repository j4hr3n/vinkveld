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

- No changes to the reveal *behavior* on pair cards (`GrapePairCard` keeps its `isRevealed` prop; its meaning shifts from "admin decided to show" to "scheduled moment has passed" — no downstream effect, since the prop is used as a boolean).
- No changes to wine nights (`hidePersonField`, rating, etc.).
- No changes to admin mode (`?admin`), pair setup, grape assignments, participants, or registration form.
- No data migration beyond ignoring `night.revealed` on old records.

## Assumptions verified against the codebase

- `night.date` is always populated at creation. `src/routes/+page.svelte:20` initializes the create-form date to today (`new Date().toISOString().split("T")[0]`) and `createNight` stores that value directly (`src/lib/firebase.ts:82–97`). We therefore do not need to add a `!!night.date` gate to `isSetupComplete`; the existing implicit guarantee is sufficient. (The `!night.date` check inside `isRevealed` itself is kept as defense-in-depth.)
- No write path spreads `night` back into Firebase. Grep for `...night`, `Object.keys(night`, `Object.values(night` across `src/` shows only reads of sub-fields (`night.participants`, `night.registrations`, `night.wines`). Therefore a persisted `revealed` field on an old record cannot be accidentally re-written after the field is removed from the type.

## Scope of changes

### 1. Data model (`src/lib/firebase.ts`)

- Remove `revealed?: boolean` from the `WineNight` type (line 66).
- Remove `"revealed"` from the `updateNight` allowed-keys tuple (line 77).

Old Firebase records may still carry a `revealed` field. After this change the value is simply ignored on read; no migration or cleanup job is required. Rationale:

- Past grape nights are typically `completed` and not re-visited.
- Any still-active night where `revealed: true` was persisted falls back to its scheduled reveal. Since scheduled reveal is now required at setup completion, affected nights already have a `revealTime`, and they will reveal at that time instead of instantly. If that scheduled time is in the past relative to "now," the night reveals on the next 30-second tick — functionally equivalent to the prior manual-reveal behavior.
- Any still-active night with `revealed: false` no longer forces-hide; schedule governs. Acceptable — forcing-hide past a scheduled reveal was always a niche override.

### 2. `src/lib/components/GrapeNightView.svelte`

- Collapse `isRevealed` (lines 40–51) and `scheduledReveal` into a single derived:

  ```ts
  let isRevealed = $derived.by(() => {
      if (!night.revealTime || !night.date) return false;
      const revealAt = new Date(`${night.date}T${night.revealTime}`);
      return now >= revealAt;
  });
  ```

  The named `scheduledReveal` derived is removed; only `isRevealed` remains. Keep the `now` state and the 30-second `setInterval` tick (trade-off discussed in "Behavior after change").
- Remove the admin reveal toggle button at lines ~93–129: the `<button>` invoking `updateNight(nightId, { revealed: !isRevealed })` together with its two inline SVG branches and label text.
- Keep the "Endre oppsett" / "Skjul oppsett" toggle (lines ~131–146) — separate feature.
- Preserve the wrapping `{#if isAdmin}` block (lines ~90–152). After removing the reveal button the block contains only the setup-toggle, which may now render on its own without the outer `flex items-center gap-3 flex-wrap` container (since there's no second button to wrap). Implementation decision: keep the container for layout stability.
- All other references to `isRevealed` (lines 277, 325, 337, 350) remain correct. The boolean semantics are unchanged for consumers.

### 3. `src/lib/components/GrapeSetup.svelte`

- Remove `let isRevealed = $derived(night.revealed === true);` (line 19).
- Remove `let confirmReveal = $state(false);` (line 65).
- Remove the entire "Manual override" block: the `{#if isRevealed} … {:else if confirmReveal} … {:else} … {/if}` branch at lines 565–609, **including its terminating `{/if}`**. The surrounding `<div class="space-y-3">` (opens at line 541) now contains only the "Scheduled reveal time" row (lines 543–563) before its closing `</div>` at line 610.
- Keep the `<section>` wrapper (line 533) and the "Synlighet" heading block (lines 534–539). With only one control under it, the heading still reads naturally as "Visibility." No change to the heading text or its gating condition (`{#if isAdmin && hasAssignments}`, line 532).
- Harden the time-input against accidental clearing (see section 5).
- After these edits, the `<section>` renders: heading → single reveal-time row. No orphan braces, no leftover confirmation state.

### 4. Require `revealTime` at setup completion

`GrapeNightView.svelte:68` currently determines setup completeness as:

```ts
let isSetupComplete = $derived(pairs.length > 0 && hasAssignments);
```

Extend to include `revealTime`:

```ts
let isSetupComplete = $derived(
    pairs.length > 0 && hasAssignments && !!night.revealTime
);
```

Effect: if pairs + grape assignments exist but `revealTime` is empty, the night stays in the setup phase. The admin sees `GrapeSetup` with the time input awaiting a value.

**UX treatment when `hasAssignments && !night.revealTime`** (concrete, not hand-waved):

- Change the row's outer border from `border-cream-dark` to `border-wine-light`.
- Change the row subtitle (`<div class="text-[0.75rem] text-text-light mt-0.5">` inside the left text column) from its current content to the literal string `Sett et klokkeslett for å fullføre oppsettet`.
- Do **not** add a separate banner, toast, or icon change. The border + subtitle is the full treatment.

Both changes revert as soon as `night.revealTime` is set.

### 5. Guard against clearing `revealTime` post-completion

The time input at `GrapeSetup.svelte:554–562` currently writes `""` when the admin clears the field:

```ts
onchange={(e) => {
    const val = (e.target as HTMLInputElement).value;
    updateNight(nightId, { revealTime: val || "" });
}}
```

Without a guard, clearing the field on a completed night would flip `isSetupComplete` to false. Because `GrapeNightView.svelte:84–85` renders `<GrapeSetup>` whenever `!isSetupComplete`, **non-admin users** on the live night would suddenly see the setup view instead of the pair gallery — a significant regression.

Change the handler to refuse empty writes:

```ts
onchange={(e) => {
    const val = (e.target as HTMLInputElement).value;
    if (!val) return; // cannot clear once set
    updateNight(nightId, { revealTime: val });
}}
```

The `<input>` stays as-is (no `required` attribute needed; the write is simply suppressed). Admins can still freely *change* the time to any value, including one in the past for immediate reveal.

## Behavior after change

**Happy path.** Admin creates grape night → date is pre-filled to today → adds participants → creates pairs → assigns grapes → sets `revealTime`. Setup completes. Pairs register their wine + dish. At the scheduled moment, the 30-second tick flips `isRevealed` to true and `GrapePairCard` reveals the wine + dish for every pair.

**Reveal early / "reveal now".** Admin edits `revealTime` to the current time or earlier. On the next tick (≤30 s) the reveal fires. The "reveal now" UX requires two actions (open time input, enter time) instead of one button press — accepted trade-off for removing the three-state logic.

**Tick granularity.** Up to ~30 s of lag between the announced reveal moment and the UI flipping. Acceptable because: (a) nobody is staring at the app with a stopwatch at reveal time, and (b) with manual override gone, reducing the interval to e.g. 5 s would only save ~25 s in the absolute worst case — not worth the extra render churn. Keep at 30 s.

**Reveal late / hide again.** Not supported. Once `revealTime` has passed, state is "revealed." Admins who want to hide again would need to edit `revealTime` to a future moment; the next tick would flip `isRevealed` back to false. This is a side-effect of the model, not a promoted feature. The UI does not advertise it.

**Past `revealTime` entered.** If an admin types a time earlier than "now" (e.g. "08:00" when current time is 20:00 on the same date), the next tick immediately flips `isRevealed` true. Treated as an explicit "reveal now" gesture. No validation added — validating future-only times would re-introduce complexity and block the explicit "reveal now" workaround.

**Cleared `revealTime` attempts.** Ignored (see section 5). The time input visually clears for a frame but the next tick restores the previous value (Svelte re-renders the controlled `value={night.revealTime ?? ""}`).

**Migration day.** If an in-flight night had `revealed: true` persisted with a `revealTime` in the future, users will see the reveal "un-happen" on reload (schedule now governs). This is unlikely in practice — the app has no announced live sessions at deploy time — and the spec accepts it rather than shipping a migration. If it matters, deploy outside of known grape-night hours.

## Testing

No automated test suite is configured. Manual verification checklist (to live in the implementation plan, not here):

1. Create a new grape night. Confirm date is prefilled to today. Add participants, create pairs, assign grapes. Verify `GrapeSetup` stays open until a `revealTime` is entered, with the border + subtitle hint active.
2. Set `revealTime` to ~1 minute in the future. Confirm the night transitions to the pair gallery view. Wait for the reveal (≤30 s after target time).
3. As admin: attempt to clear the `revealTime` field on a completed night. Confirm the write is suppressed and the UI rebounds to the prior value.
4. As admin: edit `revealTime` to a past value on the same `date`. Confirm reveal fires on next tick.
5. Open an old grape night whose Firebase record has `revealed: true` and a future `revealTime`. Confirm it renders as not-yet-revealed.
6. Open an old grape night with pairs + assignments but no `revealTime`. Confirm it re-opens the setup view with the hint active.
7. As non-admin on a completed night: confirm no reveal toggle is visible anywhere.
8. Run `bun run check`. Then grep `src/` for the literal strings `revealed`, `confirmReveal`, and `scheduledReveal`. Only legitimate remaining matches should be: the `isRevealed` local in `GrapeNightView` / `GrapePairCard`, the `isRevealed` prop on `GrapePairCard`, and any `revealed` in unrelated contexts (wine rating `<!-- Completed: all scores revealed + average -->` comment in `WineCard.svelte:187`). Zero matches for `confirmReveal` and `scheduledReveal`.

## Risks

- **Live grape night at deploy time** where `revealed: true` was manually set and `revealTime` is in the future: users see the reveal reverse on reload. See "Migration day" above.
- **Admin expects a "reveal now" button** and is confused by needing to edit the time. Mitigated by the common-case happy path (scheduled reveal works exactly as before) and accepted as a trade-off.

## Out of scope (for follow-up specs)

The initial brainstorm surfaced other simplification candidates (admin-mode scattering, wine vs grape route split, leftover-participant handling, restaurant mode). Each is its own spec. This one is deliberately narrow.
