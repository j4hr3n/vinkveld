import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  onValue,
  runTransaction,
  get,
} from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export type WineColor = "red" | "white" | "rosé" | "bubbles";
export type NightType = "home" | "restaurant" | "grape";

export interface Wine {
  id?: string;
  name: string;
  color: WineColor;
  person?: string;
  notes: string;
  link: string;
  added: string;
  ratings?: Record<string, WineRating>;
}

export interface WineRating {
  name: string;
  score: number;
}

export interface GrapeParticipant {
  name: string;
  added: string;
}

export interface GrapePair {
  memberNames: string[];
  created: string;
}

export interface GrapeRegistration {
  wineName: string;
  wineLink?: string;
  wineColor?: WineColor;
  dishName: string;
  dishDescription?: string;
  registered: string;
}

export interface WineNight {
  id?: string;
  title: string;
  date: string;
  created: string;
  completed?: boolean;
  type?: NightType;
  grapeDataVersion?: 1 | 2;
  grapeSetupComplete?: boolean;
  wines?: Record<string, Wine>;
  revealed?: boolean;
  revealTime?: string;
  grapes?: string[];
  participants?: Record<string, GrapeParticipant>;
  pairs?: Record<string, GrapePair>;
  grapeAssignments?: Record<string, string>;
  registrations?: Record<string, GrapeRegistration>;
  pairTokens?: Record<string, string>;
  grapeServingOrder?: Record<string, number>;
}

export interface GrapePrivateData {
  grapes?: string[];
  pairs?: Record<string, GrapePair>;
  grapeAssignments?: Record<string, string>;
  registrations?: Record<string, GrapeRegistration>;
  pairTokens?: Record<string, string>;
  pairTokenIndex?: Record<string, string>;
}

interface GrapePairAccess {
  pairId: string;
  pair?: GrapePair;
  grapeId?: string;
  registration?: GrapeRegistration;
}

const RATING_KEY_PREFIX = "r_";
const pendingRatingMigrations = new Set<string>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function encodeRatingName(name: string): string {
  const bytes = new TextEncoder().encode(name);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function decodeRatingName(encoded: string): string | null {
  if (encoded.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(encoded)) return null;
  const bytes = new Uint8Array(encoded.length / 2);
  for (let i = 0; i < encoded.length; i += 2) {
    bytes[i / 2] = parseInt(encoded.slice(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

export function ratingKeyForName(personName: string): string {
  return `${RATING_KEY_PREFIX}${encodeRatingName(personName.trim())}`;
}

function decodeRatingKey(key: string): string | null {
  if (!key.startsWith(RATING_KEY_PREFIX)) return null;
  return decodeRatingName(key.slice(RATING_KEY_PREFIX.length));
}

function normalizeRatingName(name: string): string {
  return name.trim();
}

function isWineRating(value: unknown): value is WineRating {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    isFiniteScore(value.score)
  );
}

function addRating(
  ratings: Record<string, WineRating>,
  name: string,
  score: number,
  overwrite: boolean
): void {
  const normalizedName = normalizeRatingName(name);
  if (!normalizedName || !isFiniteScore(score)) return;
  const key = ratingKeyForName(normalizedName);
  if (overwrite || !ratings[key]) {
    ratings[key] = { name: normalizedName, score };
  }
}

function collectLegacyRatings(
  value: unknown,
  path: string[],
  canonical: Record<string, WineRating>,
  legacy: Record<string, WineRating>
): void {
  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const fallbackName = [...path, key].join("/");

    if (isFiniteScore(child)) {
      addRating(legacy, fallbackName, child, true);
      continue;
    }

    if (isWineRating(child)) {
      addRating(
        canonical,
        normalizeRatingName(child.name) || decodeRatingKey(key) || fallbackName,
        child.score,
        true
      );
      continue;
    }

    collectLegacyRatings(child, [...path, key], canonical, legacy);
  }
}

function canonicalRatingsEqual(
  raw: unknown,
  ratings: Record<string, WineRating> | undefined
): boolean {
  if (!ratings) return raw == null;
  if (!isRecord(raw)) return false;

  const keys = Object.keys(ratings);
  const rawKeys = Object.keys(raw);
  if (keys.length !== rawKeys.length) return false;

  return keys.every((key) => {
    const rawRating = raw[key];
    const rating = ratings[key];
    return (
      isWineRating(rawRating) &&
      rawRating.name === rating.name &&
      rawRating.score === rating.score
    );
  });
}

function normalizeRatingsForMigration(rawRatings: unknown): {
  ratings?: Record<string, WineRating>;
  changed: boolean;
} {
  if (rawRatings == null) return { changed: false };

  const canonical: Record<string, WineRating> = {};
  const legacy: Record<string, WineRating> = {};
  collectLegacyRatings(rawRatings, [], canonical, legacy);

  const ratings = { ...legacy, ...canonical };
  const normalized = Object.keys(ratings).length ? ratings : undefined;

  return {
    ratings: normalized,
    changed: !canonicalRatingsEqual(rawRatings, normalized),
  };
}

function normalizeNightRatings(night: WineNight): {
  night: WineNight;
  wineIdsToMigrate: string[];
} {
  if (!night.wines) return { night, wineIdsToMigrate: [] };

  let changed = false;
  const wineIdsToMigrate: string[] = [];
  const wines: Record<string, Wine> = {};

  for (const [wineId, wine] of Object.entries(night.wines)) {
    const { ratings, changed: ratingsChanged } = normalizeRatingsForMigration(
      (wine as Omit<Wine, "ratings"> & { ratings?: unknown }).ratings
    );

    if (ratingsChanged) wineIdsToMigrate.push(wineId);

    if (ratings || ratingsChanged) {
      const normalizedWine: Wine = { ...wine };
      if (ratings) {
        normalizedWine.ratings = ratings;
      } else {
        delete normalizedWine.ratings;
      }
      wines[wineId] = normalizedWine;
      changed = true;
    } else {
      wines[wineId] = wine;
    }
  }

  return {
    night: changed ? { ...night, wines } : night,
    wineIdsToMigrate,
  };
}

async function migrateWineRatings(nightId: string, wineId: string): Promise<void> {
  const migrationKey = `${nightId}/${wineId}`;
  if (pendingRatingMigrations.has(migrationKey)) return;

  pendingRatingMigrations.add(migrationKey);
  try {
    await runTransaction(ref(db, `nights/${nightId}/wines/${wineId}/ratings`), (current) => {
      const { ratings, changed } = normalizeRatingsForMigration(current);
      return changed ? ratings ?? null : undefined;
    });
  } catch (error) {
    console.error("Failed to migrate wine ratings:", error);
  } finally {
    pendingRatingMigrations.delete(migrationKey);
  }
}

export function getWineRatingForPerson(
  ratings: Record<string, WineRating> | undefined,
  personName: string
): WineRating | undefined {
  const normalizedName = normalizeRatingName(personName);
  if (!ratings || !normalizedName) return undefined;
  return ratings[ratingKeyForName(normalizedName)];
}

export function getWineRatingEntries(
  ratings: Record<string, WineRating> | undefined
): WineRating[] {
  return Object.values(ratings ?? {});
}

export async function updateNight(
  nightId: string,
  data: Partial<Pick<WineNight, "title" | "date" | "completed" | "type" | "revealed" | "revealTime" | "grapeDataVersion" | "grapeSetupComplete">>
): Promise<void> {
  await update(ref(db, `nights/${nightId}`), data);
}

export async function createNight(
  title: string,
  date: string,
  type?: NightType
): Promise<string> {
  const nightsRef = ref(db, "nights");
  const newRef = push(nightsRef);
  const night: WineNight = {
    title,
    date,
    created: new Date().toISOString(),
    ...(type && type !== "home" ? { type } : {}),
    ...(type === "grape" ? { grapeDataVersion: 2 } : {}),
  };
  await set(newRef, night);
  return newRef.key!;
}

export function subscribeToNight(
  nightId: string,
  callback: (night: WineNight | null) => void
): () => void {
  const unsubscribe = onValue(ref(db, `nights/${nightId}`), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    const { night, wineIdsToMigrate } = normalizeNightRatings({
      id: nightId,
      ...snapshot.val(),
    } as WineNight);
    callback(night);
    for (const wineId of wineIdsToMigrate) {
      void migrateWineRatings(nightId, wineId);
    }
  });
  return unsubscribe;
}

export function subscribeToAllNights(
  callback: (nights: WineNight[]) => void,
  onError?: (error: Error) => void
): () => void {
  const unsubscribe = onValue(
    ref(db, "nights"),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      const data = snapshot.val();
      const nights: WineNight[] = Object.entries(data).map(
        ([id, val]) => ({ id, ...(val as Omit<WineNight, "id">) })
      );
      nights.sort((a, b) => b.date.localeCompare(a.date));
      callback(nights);
    },
    (error) => {
      console.error("Failed to load all nights:", error);
      onError?.(error);
    }
  );
  return unsubscribe;
}

export async function addWine(
  nightId: string,
  wine: Omit<Wine, "id" | "added">
): Promise<void> {
  const winesRef = ref(db, `nights/${nightId}/wines`);
  const newRef = push(winesRef);
  await set(newRef, {
    ...wine,
    added: new Date().toISOString(),
  });
}

export async function updateWine(
  nightId: string,
  wineId: string,
  wine: Omit<Wine, "id" | "added">
): Promise<void> {
  await update(ref(db, `nights/${nightId}/wines/${wineId}`), wine);
}

export async function removeWine(
  nightId: string,
  wineId: string
): Promise<void> {
  await remove(ref(db, `nights/${nightId}/wines/${wineId}`));
}

export async function setWineRating(
  nightId: string,
  wineId: string,
  personName: string,
  score: number
): Promise<void> {
  const name = normalizeRatingName(personName);
  if (!name) return;
  await set(ref(db, `nights/${nightId}/wines/${wineId}/ratings/${ratingKeyForName(name)}`), {
    name,
    score,
  });
}

export async function setGrapeServingOrder(
  nightId: string,
  order: Record<string, number> | null
): Promise<void> {
  await update(ref(db, `nights/${nightId}`), { grapeServingOrder: order });
}

// --- Grape night functions ---

const GRAPE_PRIVATE_ROOT = "grapePrivate";

function grapePrivatePath(nightId: string): string {
  return `${GRAPE_PRIVATE_ROOT}/${nightId}`;
}

function generateAccessToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function normalizeParticipantName(name: string): string {
  return name.trim().toLowerCase();
}

function toPairRecord(value: unknown): Record<string, GrapePair> {
  return isRecord(value) ? (value as Record<string, GrapePair>) : {};
}

function getPairMemberNames(pair: GrapePair | undefined): string[] {
  return toStringArray(pair?.memberNames);
}

function toRegistrationRecord(value: unknown): Record<string, GrapeRegistration> {
  return isRecord(value) ? (value as Record<string, GrapeRegistration>) : {};
}

function toGrapePrivateData(value: unknown): GrapePrivateData {
  if (!isRecord(value)) return {};
  return {
    grapes: toStringArray(value.grapes),
    pairs: toPairRecord(value.pairs),
    grapeAssignments: toStringRecord(value.grapeAssignments),
    registrations: toRegistrationRecord(value.registrations),
    pairTokens: toStringRecord(value.pairTokens),
    pairTokenIndex: toStringRecord(value.pairTokenIndex),
  };
}

export function subscribeToGrapePrivateData(
  nightId: string,
  callback: (data: GrapePrivateData) => void,
  onError?: (error: Error) => void
): () => void {
  return onValue(
    ref(db, grapePrivatePath(nightId)),
    (snapshot) => callback(toGrapePrivateData(snapshot.val())),
    (error) => {
      console.error("Failed to load private grape data:", error);
      onError?.(error);
    }
  );
}

export function subscribeToGrapePairAccess(
  nightId: string,
  token: string,
  callback: (data: GrapePrivateData) => void,
  onError?: (error: Error) => void
): () => void {
  if (!token.trim()) {
    callback({});
    return () => {};
  }

  return onValue(
    ref(db, `${grapePrivatePath(nightId)}/pairAccess/${token.trim()}`),
    (snapshot) => {
      const access = snapshot.val() as GrapePairAccess | null;
      if (!access?.pairId || !access.pair) {
        callback({});
        return;
      }

      callback({
        pairs: { [access.pairId]: access.pair },
        grapeAssignments: access.grapeId ? { [access.pairId]: access.grapeId } : {},
        registrations: access.registration ? { [access.pairId]: access.registration } : {},
      });
    },
    (error) => {
      console.error("Failed to load pair access data:", error);
      onError?.(error);
    }
  );
}

export async function setGrapeReveal(
  nightId: string,
  revealed: boolean,
  usePrivateData = false
): Promise<void> {
  if (!usePrivateData) {
    await updateNight(nightId, { revealed });
    return;
  }

  if (!revealed) {
    await update(ref(db, `nights/${nightId}`), {
      revealed: false,
      pairs: null,
      grapeAssignments: null,
      registrations: null,
    });
    return;
  }

  const snapshot = await get(ref(db, grapePrivatePath(nightId)));
  const privateData = toGrapePrivateData(snapshot.val());
  await update(ref(db, `nights/${nightId}`), {
    revealed: true,
    pairs: privateData.pairs ?? null,
    grapeAssignments: privateData.grapeAssignments ?? null,
    registrations: privateData.registrations ?? null,
  });
}

export async function addParticipant(
  nightId: string,
  name: string
): Promise<string> {
  const participantsRef = ref(db, `nights/${nightId}/participants`);
  const newRef = push(participantsRef);
  await set(newRef, { name, added: new Date().toISOString() });
  return newRef.key!;
}

export async function removeParticipant(
  nightId: string,
  participantId: string
): Promise<void> {
  await remove(ref(db, `nights/${nightId}/participants/${participantId}`));
}

export async function addPair(
  nightId: string,
  pair: GrapePair,
  usePrivateData = false
): Promise<string | null> {
  const pairsRef = ref(db, usePrivateData ? `${grapePrivatePath(nightId)}/pairs` : `nights/${nightId}/pairs`);
  const newRef = push(pairsRef);
  const pairId = newRef.key!;
  const newMembers = pair.memberNames.map(normalizeParticipantName);

  if (usePrivateData) {
    const token = generateAccessToken();
    const result = await runTransaction(ref(db, grapePrivatePath(nightId)), (currentData) => {
      const current = isRecord(currentData) ? currentData : {};
      const currentPairs = toPairRecord(current.pairs);
      const memberAlreadyPaired = Object.values(currentPairs).some((currentPair) =>
        getPairMemberNames(currentPair).some((name) =>
          newMembers.includes(normalizeParticipantName(name))
        )
      );

      if (memberAlreadyPaired) {
        return currentData;
      }

      return {
        ...current,
        pairs: {
          ...currentPairs,
          [pairId]: pair,
        },
        pairTokens: {
          ...toStringRecord(current.pairTokens),
          [pairId]: token,
        },
        pairTokenIndex: {
          ...toStringRecord(current.pairTokenIndex),
          [token]: pairId,
        },
        pairAccess: {
          ...(isRecord(current.pairAccess) ? current.pairAccess : {}),
          [token]: {
            pairId,
            pair,
          },
        },
      };
    });

    return result.snapshot.child(`pairs/${pairId}`).exists() ? pairId : null;
  }

  const result = await runTransaction(pairsRef, (currentData) => {
    const currentPairs = toPairRecord(currentData);
    const memberAlreadyPaired = Object.values(currentPairs).some((currentPair) =>
      getPairMemberNames(currentPair).some((name) =>
        newMembers.includes(normalizeParticipantName(name))
      )
    );

    if (memberAlreadyPaired) {
      return currentData;
    }

    return {
      ...currentPairs,
      [pairId]: pair,
    };
  });

  return result.snapshot.child(pairId).exists() ? pairId : null;
}

export async function addMemberToPair(
  nightId: string,
  pairId: string,
  memberName: string,
  usePrivateData = false
): Promise<void> {
  if (usePrivateData) {
    await runTransaction(ref(db, grapePrivatePath(nightId)), (currentData) => {
      const current = isRecord(currentData) ? currentData : {};
      const currentPairs = toPairRecord(current.pairs);
      const targetPair = currentPairs[pairId];

      if (!targetPair) {
        return currentData;
      }

      const normalizedMember = normalizeParticipantName(memberName);
      const memberAlreadyPaired = Object.values(currentPairs).some((pair) =>
        getPairMemberNames(pair).some(
          (name) => normalizeParticipantName(name) === normalizedMember
        )
      );

      if (memberAlreadyPaired) {
        return currentData;
      }

      const token = toStringRecord(current.pairTokens)[pairId];
      const memberNames = [...getPairMemberNames(targetPair), memberName];
      const updatedPair = {
        ...targetPair,
        memberNames,
      };
      const pairAccess = isRecord(current.pairAccess) ? current.pairAccess : {};

      return {
        ...current,
        pairs: {
          ...currentPairs,
          [pairId]: updatedPair,
        },
        pairAccess: token
          ? {
              ...pairAccess,
              [token]: {
                ...(isRecord(pairAccess[token]) ? pairAccess[token] : {}),
                pairId,
                pair: updatedPair,
              },
            }
          : pairAccess,
      };
    });
    return;
  }

  const pairsRef = ref(db, usePrivateData ? `${grapePrivatePath(nightId)}/pairs` : `nights/${nightId}/pairs`);
  const normalizedMember = normalizeParticipantName(memberName);

  await runTransaction(pairsRef, (currentData) => {
    const currentPairs = toPairRecord(currentData);
    const targetPair = currentPairs[pairId];

    if (!targetPair) {
      return currentData;
    }

    const targetMemberNames = getPairMemberNames(targetPair);
    const memberAlreadyPaired = Object.values(currentPairs).some((pair) =>
      getPairMemberNames(pair).some(
        (name) => normalizeParticipantName(name) === normalizedMember
      )
    );

    if (memberAlreadyPaired) {
      return currentData;
    }

    return {
      ...currentPairs,
      [pairId]: {
        ...targetPair,
        memberNames: [...targetMemberNames, memberName],
      },
    };
  });
}

export async function clearPairs(
  nightId: string,
  usePrivateData = false
): Promise<void> {
  if (usePrivateData) {
    await update(ref(db), {
      [`${grapePrivatePath(nightId)}/pairs`]: null,
      [`${grapePrivatePath(nightId)}/grapeAssignments`]: null,
      [`${grapePrivatePath(nightId)}/registrations`]: null,
      [`${grapePrivatePath(nightId)}/pairTokens`]: null,
      [`${grapePrivatePath(nightId)}/pairTokenIndex`]: null,
      [`${grapePrivatePath(nightId)}/pairAccess`]: null,
      [`nights/${nightId}/pairs`]: null,
      [`nights/${nightId}/grapeAssignments`]: null,
      [`nights/${nightId}/registrations`]: null,
      [`nights/${nightId}/grapeSetupComplete`]: false,
    });
    return;
  }

  await update(ref(db, `nights/${nightId}`), {
    pairs: null,
    grapeAssignments: null,
  });
}

export async function removePair(
  nightId: string,
  pairId: string,
  usePrivateData = false
): Promise<void> {
  if (usePrivateData) {
    const tokenSnapshot = await get(ref(db, `${grapePrivatePath(nightId)}/pairTokens/${pairId}`));
    const token = typeof tokenSnapshot.val() === "string" ? tokenSnapshot.val() : "";
    await update(ref(db), {
      [`${grapePrivatePath(nightId)}/pairs/${pairId}`]: null,
      [`${grapePrivatePath(nightId)}/grapeAssignments/${pairId}`]: null,
      [`${grapePrivatePath(nightId)}/registrations/${pairId}`]: null,
      [`${grapePrivatePath(nightId)}/pairTokens/${pairId}`]: null,
      ...(token ? { [`${grapePrivatePath(nightId)}/pairTokenIndex/${token}`]: null } : {}),
      ...(token ? { [`${grapePrivatePath(nightId)}/pairAccess/${token}`]: null } : {}),
      [`nights/${nightId}/pairs/${pairId}`]: null,
      [`nights/${nightId}/grapeAssignments/${pairId}`]: null,
      [`nights/${nightId}/registrations/${pairId}`]: null,
      [`nights/${nightId}/grapeSetupComplete`]: false,
    });
    return;
  }

  await update(ref(db, `nights/${nightId}`), {
    [`pairs/${pairId}`]: null,
    [`grapeAssignments/${pairId}`]: null,
  });
}

export async function setNightGrapeSelected(
  nightId: string,
  grapeId: string,
  selected: boolean,
  maxSelected?: number,
  usePrivateData = false
): Promise<string[]> {
  const grapesRef = ref(db, usePrivateData ? `${grapePrivatePath(nightId)}/grapes` : `nights/${nightId}/grapes`);
  const result = await runTransaction(grapesRef, (currentData) => {
    const next = toStringArray(currentData);
    const existingIndex = next.indexOf(grapeId);
    const isSelected = existingIndex >= 0;

    if (!selected && isSelected) {
      next.splice(existingIndex, 1);
      return next;
    }

    if (
      selected &&
      !isSelected &&
      maxSelected !== undefined &&
      next.length >= maxSelected
    ) {
      return currentData;
    }

    if (selected && !isSelected) {
      next.push(grapeId);
    }

    return next;
  });

  return toStringArray(result.snapshot.val());
}

export async function clearGrapeAssignments(
  nightId: string,
  usePrivateData = false
): Promise<void> {
  if (usePrivateData) {
    const tokenSnapshot = await get(ref(db, `${grapePrivatePath(nightId)}/pairTokens`));
    const updates: Record<string, null | boolean> = {
      [`${grapePrivatePath(nightId)}/grapeAssignments`]: null,
      [`nights/${nightId}/grapeAssignments`]: null,
      [`nights/${nightId}/grapeSetupComplete`]: false,
    };
    for (const token of Object.values(toStringRecord(tokenSnapshot.val()))) {
      updates[`${grapePrivatePath(nightId)}/pairAccess/${token}/grapeId`] = null;
    }
    await update(ref(db), updates);
    return;
  }

  await remove(ref(db, `nights/${nightId}/grapeAssignments`));
}

export async function updateGrapeAssignments(
  nightId: string,
  assignments: Record<string, string>,
  previousAssignmentIds: string[] = [],
  usePrivateData = false
): Promise<void> {
  const updates: Record<string, string | boolean | null> = {};
  const basePath = usePrivateData ? grapePrivatePath(nightId) : `nights/${nightId}`;
  const pairTokens = usePrivateData
    ? toStringRecord((await get(ref(db, `${grapePrivatePath(nightId)}/pairTokens`))).val())
    : {};

  for (const pairId of previousAssignmentIds) {
    if (!(pairId in assignments)) {
      updates[`${basePath}/grapeAssignments/${pairId}`] = null;
      if (pairTokens[pairId]) {
        updates[`${basePath}/pairAccess/${pairTokens[pairId]}/grapeId`] = null;
      }
    }
  }

  for (const [pairId, grapeId] of Object.entries(assignments)) {
    updates[`${basePath}/grapeAssignments/${pairId}`] = grapeId;
    if (pairTokens[pairId]) {
      updates[`${basePath}/pairAccess/${pairTokens[pairId]}/grapeId`] = grapeId;
    }
  }

  if (usePrivateData) {
    updates[`nights/${nightId}/grapeSetupComplete`] = Object.keys(assignments).length > 0;
  }

  await update(ref(db), updates);
}

export async function setRegistration(
  nightId: string,
  pairId: string,
  registration: GrapeRegistration,
  usePrivateData = false
): Promise<void> {
  if (usePrivateData) {
    const tokenSnapshot = await get(ref(db, `${grapePrivatePath(nightId)}/pairTokens/${pairId}`));
    const token = typeof tokenSnapshot.val() === "string" ? tokenSnapshot.val() : "";
    await update(ref(db), {
      [`${grapePrivatePath(nightId)}/registrations/${pairId}`]: registration,
      ...(token ? { [`${grapePrivatePath(nightId)}/pairAccess/${token}/registration`]: registration } : {}),
    });
    return;
  }

  await set(
    ref(db, `nights/${nightId}/registrations/${pairId}`),
    registration
  );
}
