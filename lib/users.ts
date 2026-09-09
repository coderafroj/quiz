import { doc, getDoc, setDoc, collection, onSnapshot } from "firebase/firestore";
import { requireDb } from "./firebase";
import type { UserProfile, UserRole } from "./types";

const COLLECTION = "users";

// Site owner's email(s) — automatically granted admin on first login,
// no manual Firestore editing required for the very first admin account.
const OWNER_EMAILS = ["coderafroj@gmail.com"];

export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName: string
): Promise<UserProfile> {
  const db = requireDb();
  const ref = doc(db, COLLECTION, uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return { uid, ...(snap.data() as Omit<UserProfile, "uid">) };
  }

  const role: UserRole = OWNER_EMAILS.includes(email.toLowerCase()) ? "admin" : "user";
  const profile: Omit<UserProfile, "uid"> = {
    displayName,
    email,
    role,
    createdAt: Date.now(),
  };
  await setDoc(ref, profile);
  return { uid, ...profile };
}

export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void
) {
  const db = requireDb();
  return onSnapshot(doc(db, COLLECTION, uid), (snap) => {
    if (!snap.exists()) {
      onChange(null);
      return;
    }
    onChange({ uid, ...(snap.data() as Omit<UserProfile, "uid">) });
  });
}

export function subscribeToAllUsers(onChange: (users: UserProfile[]) => void) {
  const db = requireDb();
  return onSnapshot(collection(db, COLLECTION), (snapshot) => {
    const users = snapshot.docs
      .map((d) => ({ uid: d.id, ...(d.data() as Omit<UserProfile, "uid">) }))
      .sort((a, b) => b.createdAt - a.createdAt);
    onChange(users);
  });
}
