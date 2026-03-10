import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  onValue,
  type DatabaseReference,
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
  person: string;
  notes: string;
  link: string;
  added: string;
}

export interface WineNight {
  id?: string;
  title: string;
  date: string;
  created: string;
  wines?: Record<string, Wine>;
}

function nightRef(nightId: string): DatabaseReference {
  return ref(db, `nights/${nightId}`);
}

export async function createNight(
  title: string,
  date: string
): Promise<string> {
  const nightsRef = ref(db, "nights");
  const newRef = push(nightsRef);
  const night: WineNight = {
    title,
    date,
    created: new Date().toISOString(),
  };
  await set(newRef, night);
  return newRef.key!;
}

export function subscribeToNight(
  nightId: string,
  callback: (night: WineNight | null) => void
): () => void {
  const unsubscribe = onValue(nightRef(nightId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: nightId, ...snapshot.val() } as WineNight);
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

