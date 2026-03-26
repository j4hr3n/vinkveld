# Eating Out Mode for Wine Nights

## Summary

Support wine nights at restaurants where no one "brings" wines. A new `type` field on wine nights controls whether person-related UI (who's bringing, participant avatars, person filter) is shown or hidden.

## Data Model

### WineNight

Add `type` field:

```
nights/<nightId>/type: "home" | "restaurant"
```

- Defaults to `"home"` when absent (backwards compatible with existing nights).
- Stored in Firebase alongside `title`, `date`, `created`, `completed`.

### Wine

The `person` field becomes optional. Wines created during restaurant nights omit `person`. Existing wines with person data are not modified when switching types — the data is simply hidden/shown.

## Interface: WineNight

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

## Interface: Wine

```ts
export interface Wine {
  id?: string;
  name: string;
  color: "red" | "white" | "rosé" | "bubbles";
  person?: string;  // was required, now optional
  notes: string;
  link: string;
  added: string;
  ratings?: Record<string, number>;
}
```

## Creation Flow (Home Page)

Add a type selector to the "Ny vinkveld" form below the date field:

- Two options: "Hjemme" and "Restaurant"
- Default: "Hjemme"
- Style: segmented toggle matching the existing form aesthetic
- The selected type is passed to `createNight()` and saved to Firebase

### `createNight` signature change

```ts
export async function createNight(
  title: string,
  date: string,
  type?: "home" | "restaurant"
): Promise<string>
```

Only writes `type` to Firebase when the value is `"restaurant"` (omitting it for `"home"` keeps backwards compat and avoids writing unnecessary data for the common case).

## Night Page Behavior

The night type is available as `night.type` (defaulting to `"home"` when absent).

### When `type === "restaurant"`:

| Element | Behavior |
|---------|----------|
| WineForm person field ("Hvem tar med?") | Hidden, not required |
| Participant avatar row | Hidden |
| Person filter | Hidden (no `selectedPerson` logic) |
| WineCard person display | Hidden |
| Profile button | Shown (still needed for rating identity) |
| Profile popover participant list | Empty (no person data), only manual name input shown |

### When `type === "home"` (or absent):

No change from current behavior.

## Header Editing

Add the type toggle to the header edit mode, alongside the existing title and date fields. Uses the same segmented toggle style as creation.

### `updateNight` signature change

```ts
export async function updateNight(
  nightId: string,
  data: Partial<Pick<WineNight, "title" | "date" | "completed" | "type">>
): Promise<void>
```

## Edge Cases

- **Switching type after wines are added**: Person data on existing wines is preserved. Switching to restaurant hides it; switching back reveals it. No data deletion.
- **Existing nights without `type`**: Treated as `"home"`. No migration needed.
- **Restaurant wine without person submitted to addWine**: The `person` field is omitted or set to empty string. The `addWine` function accepts optional person.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/firebase.ts` | Update interfaces, `createNight` and `updateNight` signatures |
| `src/routes/+page.svelte` | Add type toggle to creation form |
| `src/routes/[nightId]/+page.svelte` | Conditionally hide person-related UI, add type to header edit |
| `src/lib/components/WineForm.svelte` | Accept `hidePersonField` prop, conditionally hide person input |
| `src/lib/components/WineCard.svelte` | Accept `hidePersonField` prop, conditionally hide person display |
