# Remove Manual Reveal Toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the manual admin reveal toggle from grape nights; reveal is governed solely by the scheduled `revealTime` + `date`.

**Architecture:** Three focused edits in order: (1) strip the manual-override UI and add the "missing revealTime" hint in `GrapeSetup.svelte`; (2) collapse the three-state `isRevealed` to a single schedule-driven derived in `GrapeNightView.svelte` and gate `isSetupComplete` on `revealTime`; (3) drop `revealed` from the `WineNight` type and `updateNight` keys. Each task leaves the build green. No automated tests exist — verification is `bun run check` plus a manual browser walkthrough at the end.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Firebase Realtime DB, Tailwind 4, Bun.

**Reference spec:** `docs/superpowers/specs/2026-04-19-remove-manual-reveal-design.md`

---

## File inventory

| File | Change |
|---|---|
| `src/lib/components/GrapeSetup.svelte` | Remove `isRevealed` derived, `confirmReveal` state, manual-override block; guard empty `revealTime` writes; add conditional border + subtitle on the reveal-time row |
| `src/lib/components/GrapeNightView.svelte` | Collapse `isRevealed` + `scheduledReveal` into one derived; remove admin reveal-toggle button; gate `isSetupComplete` on `!!night.revealTime` |
| `src/lib/firebase.ts` | Remove `revealed?: boolean` from `WineNight`; remove `"revealed"` from `updateNight` allowed keys |

No new files. No existing tests to update.

---

## Task 1: Simplify `GrapeSetup.svelte`

**Files:**
- Modify: `src/lib/components/GrapeSetup.svelte` (lines 19, 65, 554–562, 565–609)

**What this task accomplishes:** removes every reference to manual reveal from the setup component, hardens the time input against empty writes, and adds the visual hint when an admin has assignments but hasn't set a reveal time. After this task, `GrapeSetup.svelte` no longer reads or writes `night.revealed`.

- [ ] **Step 1: Read the current file around the edit points**

Read `src/lib/components/GrapeSetup.svelte` lines 1–70 and 530–615 to confirm the current state matches the spec's cited line numbers.

- [ ] **Step 2: Remove the `isRevealed` derived (line 19)**

Delete this entire line:

```ts
let isRevealed = $derived(night.revealed === true);
```

There should be a blank line remaining between `let { night, nightId, isAdmin = false }: ... = $props();` and `let newName = $state("");`.

- [ ] **Step 3: Remove the `confirmReveal` state variable**

In the "Confirmation states" block around line 63–65, delete:

```ts
let confirmReveal = $state(false);
```

Keep `confirmClearPairs` and `confirmReshuffle`. The comment `// Confirmation states` stays.

- [ ] **Step 4: Harden the time-input `onchange` handler (lines 557–560)**

Replace:

```svelte
onchange={(e) => {
    const val = (e.target as HTMLInputElement).value;
    updateNight(nightId, { revealTime: val || "" });
}}
```

with:

```svelte
onchange={(e) => {
    const val = (e.target as HTMLInputElement).value;
    if (!val) return;
    updateNight(nightId, { revealTime: val });
}}
```

The behavior change: empty values (from clearing the field) are ignored. Non-empty values are written as-is.

- [ ] **Step 5: Add the "missing revealTime" visual hint to the reveal-time row**

The row opens at line 543:

```svelte
<div class="flex items-center gap-3 py-3 px-4 rounded-xl border-[1.5px] border-cream-dark bg-white/60">
```

Make its border class conditional on whether assignments exist without a reveal time. Replace the fixed `border-cream-dark` with a Svelte conditional:

```svelte
<div class="flex items-center gap-3 py-3 px-4 rounded-xl border-[1.5px] {hasAssignments && !night.revealTime ? 'border-wine-light' : 'border-cream-dark'} bg-white/60">
```

Then update the subtitle on line 550–552. Current:

```svelte
<div class="text-[0.75rem] text-text-light mt-0.5">
    {night.date ? `Den ${night.date}` : "På kveldsdagen"} kl.
</div>
```

Replace with:

```svelte
<div class="text-[0.75rem] text-text-light mt-0.5">
    {#if hasAssignments && !night.revealTime}
        Sett et klokkeslett for å fullføre oppsettet
    {:else}
        {night.date ? `Den ${night.date}` : "På kveldsdagen"} kl.
    {/if}
</div>
```

`hasAssignments` is already derived at line 41 — no new state needed.

- [ ] **Step 6: Remove the entire manual-override block (lines 565–609)**

Locate the block that begins with the `<!-- Manual override -->` comment at line 565 and ends with `{/if}` on line 609. Delete all of it, inclusive of both boundaries.

After the deletion, the outer `<div class="space-y-3">` (opens at line 541) should contain **only** the "Scheduled reveal time" block (the `<div>` opened at line 543 and closed at line 563), then close at line 610. Verify by reading lines 540–615 after the edit: the `</div>` closing `space-y-3`, the `</section>`, and the `{/if}` terminating `{#if isAdmin && hasAssignments}` should all still be intact.

- [ ] **Step 7: Verify no stale imports**

Check the `import` block at the top of the file (lines 2–13). `updateNight` is still used by Step 4 and by other handlers — keep it. All other imports are still referenced.

- [ ] **Step 8: Run type check**

Run: `bun run check`

Expected: no errors in `GrapeSetup.svelte`. Errors in `GrapeNightView.svelte` referencing `night.revealed` are expected at this stage (they're fixed in Task 2) — but they should NOT be new errors introduced by this task. In particular, make sure `svelte-check` does not flag an unknown `hasAssignments`, an unclosed `{#if}`, or a missing `{/if}` in `GrapeSetup.svelte`.

If check surfaces a **new** error inside `GrapeSetup.svelte`, fix it before proceeding.

- [ ] **Step 9: Commit**

```bash
git add src/lib/components/GrapeSetup.svelte
git commit -m "refactor: strip manual reveal UI from GrapeSetup"
```

---

## Task 2: Simplify `GrapeNightView.svelte`

**Files:**
- Modify: `src/lib/components/GrapeNightView.svelte` (lines 40–51, 68, 90–152)

**What this task accomplishes:** collapses the three-state reveal logic into a single derived driven by the schedule, removes the admin reveal-toggle button, and requires `revealTime` for setup to be complete. After this task, `GrapeNightView.svelte` no longer reads or writes `night.revealed`.

- [ ] **Step 1: Read the file top-to-bottom to confirm current state**

Read `src/lib/components/GrapeNightView.svelte` (entire file). Confirm the `isRevealed` / `scheduledReveal` derivations at lines 40–51, `isSetupComplete` at line 68, and the admin controls block at lines 90–152 match the spec.

- [ ] **Step 2: Collapse `scheduledReveal` and `isRevealed` into a single derived**

Replace lines 40–51:

```ts
let scheduledReveal = $derived.by(() => {
    if (!night.revealTime || !night.date) return false;
    const revealAt = new Date(`${night.date}T${night.revealTime}`);
    return now >= revealAt;
});

// revealed === true  -> force show
// revealed === false -> force hide (overrides schedule)
// revealed absent    -> follow schedule
let isRevealed = $derived(
    night.revealed === true || (night.revealed !== false && scheduledReveal)
);
```

with:

```ts
let isRevealed = $derived.by(() => {
    if (!night.revealTime || !night.date) return false;
    const revealAt = new Date(`${night.date}T${night.revealTime}`);
    return now >= revealAt;
});
```

The `now` state and `setInterval` tick (lines 31–38) stay as-is.

- [ ] **Step 3: Require `revealTime` for setup completion**

On line 68:

```ts
let isSetupComplete = $derived(pairs.length > 0 && hasAssignments);
```

Change to:

```ts
let isSetupComplete = $derived(
    pairs.length > 0 && hasAssignments && !!night.revealTime
);
```

- [ ] **Step 4: Remove the admin reveal-toggle button**

Inside the `{#if isAdmin}` block (line 90) there is currently a `<div class="flex items-center gap-3 animate-fade-in flex-wrap">` containing two children: the reveal-toggle `<button>` (lines 93–129) and the "Endre oppsett" / "Skjul oppsett" toggle (lines 131–146).

Delete the first child — the entire `<button>` from the `<button onclick={() => updateNight(nightId, { revealed: !isRevealed })}` at line 93 through its closing `</button>` at line 129, inclusive.

Keep the wrapping `<div class="flex items-center gap-3 animate-fade-in flex-wrap">` and the "Endre oppsett" toggle block (the `{#if showSetup}...{:else}...{/if}` at lines 131–146). The container now holds a single child, which is fine — spec explicitly chooses to keep the container for layout stability.

- [ ] **Step 5: Verify remaining `isRevealed` usages still make sense**

Grep within the file for `isRevealed`:

Run Grep on `src/lib/components/GrapeNightView.svelte` for pattern `isRevealed`.

Expected remaining matches (all correct with the new semantics "scheduled moment has passed"):
- The `isRevealed` derivation itself.
- Line ~277: `{#if myPairId && myGrapeId && !isRevealed}` — registration form hidden once revealed.
- Line ~325: `{#if currentUser && !myPairId && !isRevealed}` — spectator message before reveal.
- Line ~337: `{isRevealed ? "Kveldens par" : "Par og druer"}` — heading.
- Line ~350: `{isRevealed}` passed as prop to `GrapePairCard`.

Zero matches for `scheduledReveal`, `night.revealed`, or `revealed:`.

- [ ] **Step 6: Run type check**

Run: `bun run check`

Expected: no errors in `GrapeNightView.svelte`. The type error in `firebase.ts` (or in callers) referencing the still-present `revealed` field on `WineNight` is fine at this stage; it disappears in Task 3.

Specifically, there should be **zero** new `GrapeNightView.svelte` errors. If `svelte-check` reports any, fix before proceeding.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/GrapeNightView.svelte
git commit -m "refactor: drive grape-night reveal from schedule only"
```

---

## Task 3: Remove `revealed` from the data model

**Files:**
- Modify: `src/lib/firebase.ts` (lines 66, 77)

**What this task accomplishes:** deletes the now-unused `revealed` field from the `WineNight` type and the `updateNight` allowed-keys tuple. After this task, no code in `src/` references `night.revealed` for reads or writes.

- [ ] **Step 1: Read `src/lib/firebase.ts` lines 55–85 to confirm current state**

Confirm `revealed?: boolean;` sits at line 66 and `"revealed"` appears in the `updateNight` `Partial<Pick<...>>` tuple at line 77.

- [ ] **Step 2: Remove `revealed?: boolean;` from `WineNight`**

Delete line 66. The surrounding lines in the `WineNight` interface should be:

```ts
wines?: Record<string, Wine>;
revealTime?: string;
grapes?: string[];
```

- [ ] **Step 3: Remove `"revealed"` from the `updateNight` tuple**

Line 77 is currently:

```ts
data: Partial<Pick<WineNight, "title" | "date" | "completed" | "type" | "revealed" | "revealTime">>
```

Change to:

```ts
data: Partial<Pick<WineNight, "title" | "date" | "completed" | "type" | "revealTime">>
```

- [ ] **Step 4: Run type check**

Run: `bun run check`

Expected: 0 errors. If the check surfaces any `revealed` references still in the codebase, they were missed in Tasks 1–2; go back and remove them, then re-run.

- [ ] **Step 5: Grep-verify cleanup**

Run three Grep searches against `src/`:

1. Pattern: `confirmReveal` — expected: 0 matches.
2. Pattern: `scheduledReveal` — expected: 0 matches.
3. Pattern: `revealed` — expected: only the match at `src/lib/components/WineCard.svelte:187` (a comment about rating reveal) and matches inside `isRevealed` identifiers in `GrapeNightView.svelte`, `GrapePairCard.svelte`, and `GrapeInfoCard.svelte`. Zero references to the string `night.revealed` or to `revealed:` as an object key.

If any unexpected match appears, clean it up in the owning file, re-run check, then proceed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/firebase.ts
git commit -m "refactor: drop manual reveal field from WineNight"
```

---

## Task 4: Manual verification

**Files:** none modified.

**What this task accomplishes:** exercises the changed behavior in a real browser to catch issues that type-checking cannot (layout regressions, UX hint rendering, reveal tick). No automated tests exist, so this is the only way to prove the feature works end-to-end.

- [ ] **Step 1: Start the dev server**

Run: `bun run dev`

Expected: server boots cleanly at `http://localhost:5173`.

- [ ] **Step 2: Verify `bun run check` is still clean**

Run: `bun run check` in a separate terminal (dev server keeps running).

Expected: 0 errors, 0 warnings related to this change.

- [ ] **Step 3: Create a fresh grape night and reach the "missing revealTime" state**

In the browser:

1. Open `http://localhost:5173`.
2. Create a new grape night (title + today's date + grape type). You should land on the night page in admin mode (via `?admin`).
3. Add 2+ participants.
4. Create at least one pair.
5. Select at least one grape and assign it to the pair.

**Expected:** the page stays in `GrapeSetup` view (no pair gallery). The "Avsløres automatisk" row shows a `border-wine-light` border and the subtitle reads `Sett et klokkeslett for å fullføre oppsettet`.

- [ ] **Step 4: Set a future `revealTime` and confirm transition**

Enter a time roughly 1–2 minutes ahead of now.

**Expected:** the page switches to the pair gallery (`GrapeNightView` renders pairs). The reveal-time row, if re-opened via "Endre oppsett," shows the normal `border-cream-dark` border and the original subtitle (`Den <date> kl.`).

- [ ] **Step 5: Register a pair and verify reveal behavior**

Still as admin (or switch to a participant identity via profile popover):

1. As the paired participant, register a wine + dish.
2. Observe the pair card: wine + dish are hidden from other (non-member) views.
3. Wait for the scheduled reveal time to pass (give it up to 30 additional seconds for the tick).

**Expected:** the pair card flips to revealed state automatically. The heading "Par og druer" becomes "Kveldens par."

- [ ] **Step 6: Attempt to clear `revealTime` and confirm the guard**

Open "Endre oppsett," then clear the time input (browser's clear affordance, or manual delete).

**Expected:** the `onchange` fires with empty value, the write is suppressed, and on the next render the input restores the previous value. The night does NOT bounce back to the setup view.

- [ ] **Step 7: Verify past-time "reveal now"**

Open "Endre oppsett" again, change `revealTime` to a value clearly earlier than the current clock time on today's `date`.

**Expected:** within ~30 seconds the reveal fires (pair card flips to revealed). No confirmation dialog, no error.

- [ ] **Step 8: Confirm no reveal toggle anywhere**

Visually scan `GrapeNightView` admin controls. There should be only the "Endre oppsett" / "Skjul oppsett" text button. No "Synlig for alle" / "Skjult for andre" button anywhere on the page.

In `GrapeSetup` reveal section ("Synlighet"), the only control under the heading is the reveal-time row. No "Avsløre nå" button, no confirmation prompt.

- [ ] **Step 9: (Optional) Inspect an existing night with legacy `revealed` data**

If any pre-existing grape nights live in Firebase with `revealed: true | false` persisted, open one and confirm it renders per the new rules (reveal governed by schedule, legacy field ignored). Skip if no such record exists.

- [ ] **Step 10: Stop the dev server**

Ctrl+C the `bun run dev` process.

- [ ] **Step 11: No commit**

This task is verification-only; nothing to commit. If any step failed, go back to the relevant task, fix, re-run check, re-verify.

---

## Done

After all four tasks complete, the branch contains three commits:

1. `refactor: strip manual reveal UI from GrapeSetup`
2. `refactor: drive grape-night reveal from schedule only`
3. `refactor: drop manual reveal field from WineNight`

Net effect: three-state reveal logic → single schedule-driven derived; zero references to `night.revealed`; `revealTime` is required to leave the setup phase.
