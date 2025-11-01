
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    // Note: This requires GOOGLE_APPLICATION_CREDENTIALS to be set in the environment.
    // In Firebase Hosting with a Next.js backend, this is handled automatically.
    // For local development, you need to set this environment variable to point to your service account key file.
    // e.g., export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
}

export const db = admin.firestore();
export const auth = admin.auth();

    