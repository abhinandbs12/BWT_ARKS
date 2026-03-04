// Firebase configuration
// Replace env vars in .env with your actual Firebase project config
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type ApplicationVerifier,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const DEMO_API_KEY = 'demo-api-key'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || DEMO_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'crediq-demo.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'crediq-demo',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'crediq-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:123456789:web:abcdef',
}

// True when real Firebase keys are NOT present → use demo OTP flow
export const isFirebaseDemoMode = firebaseConfig.apiKey === DEMO_API_KEY

let app: ReturnType<typeof initializeApp>
let auth: ReturnType<typeof getAuth>
let db: ReturnType<typeof getFirestore>
let storage: ReturnType<typeof getStorage> | null = null

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} catch (err) {
  console.warn('Firebase Auth/Firestore init error (demo mode):', err)
}

// Storage is optional — only init if not already failing
try {
  if (app!) storage = getStorage(app)
} catch {
  console.warn('Firebase Storage not enabled — skipping')
}

export { auth, db, storage }

// ===== Phone Auth Helpers =====

let recaptchaVerifier: RecaptchaVerifier | null = null

/**
 * Initialise invisible reCAPTCHA once and reuse.
 * @param buttonId – id of a DOM element (the Send OTP button works fine)
 */
export function getRecaptchaVerifier(buttonId: string): ApplicationVerifier {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: 'invisible',
      callback: () => { /* reCAPTCHA solved */ },
      'expired-callback': () => {
        recaptchaVerifier?.clear()
        recaptchaVerifier = null   // force re-init on expiry
      },
    })
  }
  return recaptchaVerifier
}

/**
 * Send a real OTP via Firebase.
 * Phone must be in E.164 format: "+91XXXXXXXXXX"
 */
export async function sendPhoneOTP(
  phoneE164: string,
  buttonId: string,
): Promise<ConfirmationResult> {
  try {
    const verifier = getRecaptchaVerifier(buttonId)
    const confirmation = await signInWithPhoneNumber(auth, phoneE164, verifier)
    return confirmation
  } catch (err) {
    // Reset reCAPTCHA on any error so next attempt works
    recaptchaVerifier?.clear()
    recaptchaVerifier = null
    throw err
  }
}

/**
 * Verify the OTP the user typed.
 * Returns the Firebase UID on success.
 */
export async function verifyPhoneOTP(
  confirmation: ConfirmationResult,
  otp: string,
): Promise<string> {
  const result = await confirmation.confirm(otp)
  return result.user.uid
}

// ===== Firestore Helpers =====

// User
export async function saveUser(uid: string, data: Record<string, unknown>) {
  try {
    await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true })
  } catch (err) {
    console.warn('Firestore saveUser error:', err)
  }
}

export async function getUser(uid: string) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : null
  } catch {
    return null
  }
}

// CredScore
export async function saveCredScore(uid: string, scoreData: Record<string, unknown>) {
  try {
    const id = `${uid}_${Date.now()}`
    await setDoc(doc(db, 'credscores', id), {
      userId: uid,
      ...scoreData,
      calculatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.warn('Firestore saveCredScore error:', err)
  }
}

export async function getLatestCredScore(uid: string) {
  try {
    const q = query(
      collection(db, 'credscores'),
      where('userId', '==', uid),
      orderBy('calculatedAt', 'desc'),
      limit(1),
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return snap.docs[0].data()
  } catch {
    return null
  }
}

// Scammers
export async function lookupScammer(identifier: string) {
  try {
    const q = query(
      collection(db, 'scammers'),
      where('identifiers', 'array-contains', identifier),
      limit(1),
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return snap.docs[0].data()
  } catch {
    return null
  }
}

export async function reportScammer(data: Record<string, unknown>) {
  try {
    const id = `scam_${Date.now()}`
    await setDoc(doc(db, 'scammers', id), {
      ...data,
      reportedAt: serverTimestamp(),
      verified: false,
    })
  } catch (err) {
    console.warn('Firestore reportScammer error:', err)
  }
}
