import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  onValue,
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
  ratings?: Record<string, number>;
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
  wines?: Record<string, Wine>;
  revealed?: boolean;
  revealTime?: string;
  grapes?: string[];
  participants?: Record<string, GrapeParticipant>;
  pairs?: Record<string, GrapePair>;
  grapeAssignments?: Record<string, string>;
  registrations?: Record<string, GrapeRegistration>;
}

export async function updateNight(
  nightId: string,
  data: Partial<Pick<WineNight, "title" | "date" | "completed" | "type" | "revealed" | "revealTime">>
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
    callback({ id: nightId, ...snapshot.val() } as WineNight);
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
  await set(ref(db, `nights/${nightId}/wines/${wineId}/ratings/${personName}`), score);
}

// --- Grape night functions ---

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

export async function setPairs(
  nightId: string,
  pairs: Record<string, GrapePair>
): Promise<void> {
  await set(ref(db, `nights/${nightId}/pairs`), pairs);
}

export async function clearPairs(nightId: string): Promise<void> {
  await update(ref(db, `nights/${nightId}`), {
    pairs: null,
    grapeAssignments: null,
  });
}

export async function removePair(
  nightId: string,
  pairId: string
): Promise<void> {
  await remove(ref(db, `nights/${nightId}/pairs/${pairId}`));
  await remove(ref(db, `nights/${nightId}/grapeAssignments/${pairId}`));
}

export async function setNightGrapes(
  nightId: string,
  grapeIds: string[]
): Promise<void> {
  await set(ref(db, `nights/${nightId}/grapes`), grapeIds);
}

export async function setGrapeAssignments(
  nightId: string,
  assignments: Record<string, string>
): Promise<void> {
  await set(ref(db, `nights/${nightId}/grapeAssignments`), assignments);
}

export async function setRegistration(
  nightId: string,
  pairId: string,
  registration: GrapeRegistration
): Promise<void> {
  await set(ref(db, `nights/${nightId}/registrations/${pairId}`), registration);
}


