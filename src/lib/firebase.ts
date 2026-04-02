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

export interface WineNight {
  id?: string;
  title: string;
  date: string;
  created: string;
  completed?: boolean;
  type?: "home" | "restaurant";
  wines?: Record<string, Wine>;
}

export async function updateNight(
  nightId: string,
  data: Partial<Pick<WineNight, "title" | "date" | "completed" | "type">>
): Promise<void> {
  await update(ref(db, `nights/${nightId}`), data);
}

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
  callback: (nights: WineNight[]) => void
): () => void {
  const unsubscribe = onValue(ref(db, "nights"), (snapshot) => {
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
  });
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

