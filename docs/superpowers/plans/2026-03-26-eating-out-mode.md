# Eating Out Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support restaurant wine nights where no one brings wines, hiding all person-related UI when the night type is "restaurant".

**Architecture:** A `type` field on the `WineNight` model drives conditional rendering across WineForm, WineCard, and the night page. Default is "home" (backwards compatible). The type is set at creation and editable in the header.

**Tech Stack:** SvelteKit 2 + Svelte 5 (runes), Firebase Realtime Database, Tailwind CSS 4

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/firebase.ts` | Modify | Update `WineNight` and `Wine` interfaces, update `createNight` signature |
| `src/routes/+page.svelte` | Modify | Add type toggle to creation form |
| `src/routes/[nightId]/+page.svelte` | Modify | Pass `isRestaurant` to child components, hide participant avatars/filter, add type to header edit |
| `src/lib/components/WineForm.svelte` | Modify | Accept `hidePersonField` prop, conditionally hide person input |
| `src/lib/components/WineCard.svelte` | Modify | Accept `hidePersonField` prop, conditionally hide person avatar and person text |

---

### Task 1: Update data model and Firebase functions

**Files:**
- Modify: `src/lib/firebase.ts:25-65`

- [ ] **Step 1: Update `WineNight` interface — add `type` field**

In `src/lib/firebase.ts`, change the `WineNight` interface:

```ts
export interface WineNight {
  id?: string;
  title: string;
  date: string;
  created: string;
  completed?: boolean;
  type?: "home" | "restaurant";
  wines?: Record<string, Wine>;
}
```

- [ ] **Step 2: Make `person` optional on `Wine` interface**

In `src/lib/firebase.ts`, change the `Wine` interface:

```ts
export interface Wine {
  id?: string;
  name: string;
  color: "red" | "white" | "rosé" | "bubbles";
  person?: string;
  notes: string;
  link: string;
  added: string;
  ratings?: Record<string, number>;
}
```

- [ ] **Step 3: Update `createNight` to accept optional type**

```ts
export async function createNight(
  title: string,
  date: string,
  type?: "home" | "restaurant"
): Promise<string> {
  const nightsRef = ref(db, "nights");
  const newRef = push(nightsRef);
  const night: WineNight = {
    title,
    date,
    created: new Date().toISOString(),
    ...(type === "restaurant" ? { type } : {}),
  };
  await set(newRef, night);
  return newRef.key!;
}
```

- [ ] **Step 4: Update `updateNight` to allow updating `type`**

```ts
export async function updateNight(
  nightId: string,
  data: Partial<Pick<WineNight, "title" | "date" | "completed" | "type">>
): Promise<void> {
  await update(ref(db, `nights/${nightId}`), data);
}
```

- [ ] **Step 5: Run type check**

Run: `bun run check`
Expected: No new errors (existing warnings in WineForm/WineSearchModal are pre-existing).

- [ ] **Step 6: Commit**

```bash
git add src/lib/firebase.ts
git commit -m "feat: add type field to WineNight, make person optional on Wine"
```

---

### Task 2: Add type toggle to creation form

**Files:**
- Modify: `src/routes/+page.svelte:1-120`

- [ ] **Step 1: Add `nightType` state and pass it to `createNight`**

In the `<script>` section, add state after the `creating` declaration (line 11):

```ts
let nightType = $state<"home" | "restaurant">("home");
```

Update `handleCreate` to pass the type:

```ts
async function handleCreate() {
    if (!title.trim()) {
        titleInput?.focus();
        return;
    }
    creating = true;
    const id = await createNight(title.trim(), date, nightType);
    goto(`${base}/${id}`);
}
```

- [ ] **Step 2: Add the toggle UI below the date field**

Insert between the date `</div>` (after line 112) and the submit button (line 113):

```svelte
<div class="mb-7">
    <div
        class="block text-[0.82rem] font-medium text-text-light mb-2 uppercase tracking-wider"
    >Sted</div>
    <div class="grid grid-cols-2 gap-3">
        <button
            type="button"
            class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-[1.5px] cursor-pointer transition-all duration-300 font-[inherit] text-[0.9rem] font-medium {nightType === 'home'
                ? 'border-wine bg-white shadow-[0_2px_8px_rgba(92,26,42,0.1)] text-wine'
                : 'border-cream-dark bg-cream/40 text-text-light hover:border-wine-light hover:bg-white/60'}"
            onclick={() => (nightType = "home")}
        >
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2 8l6-5 6 5M4 7v6h3v-3h2v3h3V7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Hjemme
        </button>
        <button
            type="button"
            class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-[1.5px] cursor-pointer transition-all duration-300 font-[inherit] text-[0.9rem] font-medium {nightType === 'restaurant'
                ? 'border-wine bg-white shadow-[0_2px_8px_rgba(92,26,42,0.1)] text-wine'
                : 'border-cream-dark bg-cream/40 text-text-light hover:border-wine-light hover:bg-white/60'}"
            onclick={() => (nightType = "restaurant")}
        >
            <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 2v5c0 1.7 1.3 3 3 3h0c1.7 0 3-1.3 3-3V2M6 10v4M4 14h4M13 2v4c0 .6-.4 1-1 1h-1V2M11 7v7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Restaurant
        </button>
    </div>
</div>
```

- [ ] **Step 3: Verify in browser**

Run: `bun run dev`
Open localhost:5173/vinkveld. Verify:
- The type toggle appears between date and the create button
- "Hjemme" is selected by default
- Clicking "Restaurant" toggles the selection
- Creating a night with each type works

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add home/restaurant toggle to night creation form"
```

---

### Task 3: Update WineForm to conditionally hide person field

**Files:**
- Modify: `src/lib/components/WineForm.svelte:20-38,66-90,147-159`

- [ ] **Step 1: Add `hidePersonField` prop**

In the props destructuring (line 20), add the new prop:

```ts
let {
    editing = null,
    currentUser = '',
    hidePersonField = false,
    onSubmit,
    onCancel,
    onPersonChange,
}: {
    editing: (Wine & { id: string }) | null;
    currentUser?: string;
    hidePersonField?: boolean;
    onSubmit: (data: {
        name: string;
        person: string;
        color: Wine["color"];
        link: string;
        notes: string;
    }) => Promise<void>;
    onCancel?: () => void;
    onPersonChange?: (name: string) => void;
} = $props();
```

- [ ] **Step 2: Skip person validation when hidden**

In `handleSubmit`, make the person validation conditional:

```ts
async function handleSubmit() {
    if (!name.trim()) {
        nameInput?.focus();
        return;
    }
    if (!hidePersonField && !person.trim()) {
        personInput?.focus();
        return;
    }
    submitting = true;
    if (!hidePersonField) setUserName(person);
    await onSubmit({
        name: name.trim(),
        person: hidePersonField ? "" : person.trim(),
        color: selectedColor,
        link: link.trim(),
        notes: notes.trim(),
    });
    if (!editing) {
        name = "";
        link = "";
        notes = "";
    }
    submitting = false;
}
```

- [ ] **Step 3: Conditionally render the person input**

Wrap the person field div (lines 147-159) with a condition. Change the flex layout so the wine name field takes full width when person is hidden:

```svelte
<div class="flex gap-4 max-[480px]:flex-col max-[480px]:gap-0">
    <div class="{hidePersonField ? 'flex-1' : 'flex-[2]'} mb-5">
        <label for="wine-name" class={fieldLabelClass}>Vin</label>
        <div class="flex gap-2">
            <!-- ...existing wine name input and search button unchanged... -->
        </div>
    </div>
    {#if !hidePersonField}
        <div class="flex-1 mb-5">
            <label for="wine-person" class={fieldLabelClass}>Hvem tar med?</label>
            <input
                type="text"
                id="wine-person"
                placeholder="Ditt navn"
                bind:value={person}
                bind:this={personInput}
                class={fieldInputClass}
            />
        </div>
    {/if}
</div>
```

- [ ] **Step 4: Run type check**

Run: `bun run check`
Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/WineForm.svelte
git commit -m "feat: add hidePersonField prop to WineForm"
```

---

### Task 4: Update WineCard to conditionally hide person info

**Files:**
- Modify: `src/lib/components/WineCard.svelte:7-25,88-120`

- [ ] **Step 1: Add `hidePersonField` prop**

In the props destructuring (line 7), add the new prop:

```ts
let {
    wine,
    isEditing = false,
    completed = false,
    hidePersonField = false,
    onEdit,
    onDelete,
    index = 0,
    currentUser = '',
    onRate,
}: {
    wine: Wine & { id: string };
    isEditing: boolean;
    completed?: boolean;
    hidePersonField?: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    index?: number;
    currentUser?: string;
    onRate?: (wineId: string, score: number) => void;
} = $props();
```

- [ ] **Step 2: Conditionally hide the initials avatar**

The initials avatar (lines 91-96) derives from `wine.person`. Wrap it:

```svelte
<!-- Top row: avatar + info + actions -->
<div class="flex items-start gap-4">
    {#if !hidePersonField}
        <!-- Initials avatar -->
        <div
            class="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[0.7rem] font-bold tracking-wide text-white/90 mt-0.5"
            style="background: {stripeColors[wine.color] ?? '#999'}"
        >
            {initials}
        </div>
    {/if}
```

- [ ] **Step 3: Conditionally hide person name in the info line**

The person display (lines 116-120) shows `wine.person · color`. When person is hidden, just show the color:

```svelte
<div class="text-text-light text-[0.85rem] mt-1 flex items-center gap-2">
    {#if !hidePersonField && wine.person}
        <span>{wine.person}</span>
        <span class="text-cream-dark">·</span>
    {/if}
    <span class="text-[0.8rem] opacity-70">{colorLabels[wine.color] ?? wine.color}</span>
</div>
```

- [ ] **Step 4: Run type check**

Run: `bun run check`
Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/WineCard.svelte
git commit -m "feat: add hidePersonField prop to WineCard"
```

---

### Task 5: Wire up the night page

**Files:**
- Modify: `src/routes/[nightId]/+page.svelte`

This is the largest task — it connects everything together.

- [ ] **Step 1: Add `isRestaurant` derived state**

After the `completed` derived (line 71), add:

```ts
let isRestaurant = $derived((night?.type ?? "home") === "restaurant");
```

- [ ] **Step 2: Conditionally hide participant avatars and person filter**

Wrap the participant avatars section (lines 502-531) with a condition:

```svelte
{#if !isRestaurant && participants.length > 0}
    <div class="mb-5 animate-fade-in" style="animation-delay:0.08s">
        <!-- ...existing avatar row unchanged... -->
    </div>
{/if}
```

- [ ] **Step 3: Remove person filter from wine count label when restaurant**

In the wine count label (line 592), guard the person filter text:

```svelte
<div class="text-[0.78rem] font-medium text-text-light uppercase tracking-wider group-hover/toggle:text-wine transition-colors duration-200">
    {filteredWines.length}{filteredWines.length === 1 ? " vin" : " viner"}{#if !isRestaurant && selectedPerson}{" "}fra {selectedPerson}{/if}
</div>
```

- [ ] **Step 4: Pass `hidePersonField` to WineCard**

In the WineCard usage (lines 608-618):

```svelte
<WineCard
    {wine}
    isEditing={editingWineId === wine.id}
    {completed}
    hidePersonField={isRestaurant}
    onEdit={startEdit}
    onDelete={handleDelete}
    index={i}
    {currentUser}
    onRate={handleRate}
/>
```

- [ ] **Step 5: Pass `hidePersonField` to WineForm**

In the WineForm usage (lines 651-657):

```svelte
<WineForm
    editing={editingWine}
    {currentUser}
    hidePersonField={isRestaurant}
    onSubmit={editingWine ? handleEdit : handleAdd}
    onCancel={() => (editingWineId = null)}
    onPersonChange={(name) => (currentUser = name)}
/>
```

- [ ] **Step 6: Show profile button for restaurant nights (for rating identity)**

Currently the profile button only shows when `wines.length > 0` (line 414). For restaurant nights, also show it so users can set their identity for ratings. Change the condition:

```svelte
{#if wines.length > 0 || isRestaurant}
```

- [ ] **Step 7: Add type toggle to header edit mode**

In the header edit section (after the date input, around line 456), add the type toggle:

```svelte
<input
    type="date"
    bind:value={editDate}
    onkeydown={(e) => { if (e.key === 'Escape') cancelEditHeader(); }}
    class="font-accent italic text-text-light text-base bg-transparent border-0 border-b border-cream-dark focus:outline-none focus:border-wine-light font-[inherit] px-0 mb-3"
/>
<div class="flex gap-2 mb-3">
    <button
        type="button"
        class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[0.82rem] font-medium font-[inherit] cursor-pointer transition-all duration-200 border-[1.5px] {editType === 'home'
            ? 'border-wine bg-wine/5 text-wine'
            : 'border-cream-dark bg-transparent text-text-light hover:border-wine-light'}"
        onclick={() => (editType = "home")}
    >
        Hjemme
    </button>
    <button
        type="button"
        class="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[0.82rem] font-medium font-[inherit] cursor-pointer transition-all duration-200 border-[1.5px] {editType === 'restaurant'
            ? 'border-wine bg-wine/5 text-wine'
            : 'border-cream-dark bg-transparent text-text-light hover:border-wine-light'}"
        onclick={() => (editType = "restaurant")}
    >
        Restaurant
    </button>
</div>
```

- [ ] **Step 8: Add `editType` state and wire up save/start functions**

Add state alongside the other header edit states (around line 33):

```ts
let editType = $state<"home" | "restaurant">("home");
```

Update `startEditHeader`:

```ts
function startEditHeader() {
    editTitle = night!.title;
    editDate = night!.date;
    editType = night!.type ?? "home";
    editingHeader = true;
}
```

Update `saveHeader` to include type:

```ts
async function saveHeader() {
    const t = editTitle.trim();
    if (!t) return;
    savingHeader = true;
    try {
        await updateNight(nightId!, { title: t, date: editDate, type: editType });
        editingHeader = false;
    } finally {
        savingHeader = false;
    }
}
```

- [ ] **Step 9: Clear person filter when switching to restaurant**

When the night type is restaurant, `selectedPerson` should be null. Add after the `isRestaurant` derived:

```ts
$effect(() => {
    if (isRestaurant) selectedPerson = null;
});
```

- [ ] **Step 10: Run type check and verify in browser**

Run: `bun run check`
Expected: No new errors.

Run: `bun run dev`
Verify:
- Create a restaurant night — person field hidden in form, no avatars, no person on cards
- Create a home night — everything works as before
- Edit a night's header — type toggle appears and works
- Switch an existing home night to restaurant — person info hides
- Switch back — person info reappears
- Rating still works on restaurant nights via profile popover

- [ ] **Step 11: Commit**

```bash
git add src/routes/[nightId]/+page.svelte
git commit -m "feat: wire up eating-out mode on night page"
```

---

### Task 6: Build verification and final cleanup

- [ ] **Step 1: Run full build**

Run: `bun run build`
Expected: Build succeeds with no new errors.

- [ ] **Step 2: Run type check**

Run: `bun run check`
Expected: No new errors beyond pre-existing warnings.

- [ ] **Step 3: Manual smoke test**

Test the following flows:
1. Create a "Hjemme" night → add wine → person field visible, avatar visible → works as before
2. Create a "Restaurant" night → add wine → no person field, no avatar, no participant row
3. Edit restaurant night header → switch to "Hjemme" → person info appears on existing wines (empty, but visible)
4. Rate a wine on a restaurant night → profile popover works for identity
5. Existing nights without `type` field → behave as "Hjemme"

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup for eating-out mode"
```
