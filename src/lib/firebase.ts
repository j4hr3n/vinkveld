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

const WRITE_TIMEOUT_MS = 8000;

class OfflineError extends Error {
  constructor() {
    super("Du ser ut til å være frakoblet. Sjekk internettforbindelsen.");
    this.name = "OfflineError";
  }
}

class TimeoutError extends Error {
  constructor() {
    super("Handlingen tok for lang tid. Sjekk internettforbindelsen og prøv igjen.");
    this.name = "TimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, ms = WRITE_TIMEOUT_MS): Promise<T> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return Promise.reject(new OfflineError());
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

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
  await withTimeout(set(newRef, night));
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

export async function addWine(
  nightId: string,
  wine: Omit<Wine, "id" | "added">
): Promise<void> {
  const winesRef = ref(db, `nights/${nightId}/wines`);
  const newRef = push(winesRef);
  await withTimeout(set(newRef, {
    ...wine,
    added: new Date().toISOString(),
  }));
}

export async function updateWine(
  nightId: string,
  wineId: string,
  wine: Omit<Wine, "id" | "added">
): Promise<void> {
  await withTimeout(update(ref(db, `nights/${nightId}/wines/${wineId}`), wine));
}

export async function removeWine(
  nightId: string,
  wineId: string
): Promise<void> {
  await withTimeout(remove(ref(db, `nights/${nightId}/wines/${wineId}`)));
}

