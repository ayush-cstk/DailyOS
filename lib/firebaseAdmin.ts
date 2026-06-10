import admin from "firebase-admin";

// Initialise once — safe to call multiple times
if (!admin.apps.length) {
  const projectId  = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    // Fallback for local dev without service account — uses client SDK instead
    admin.initializeApp({ projectId });
  }
}

export const adminDb = admin.firestore();
export default admin;
