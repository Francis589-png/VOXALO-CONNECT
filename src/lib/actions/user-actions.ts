
'use server';

import { db, auth as adminAuth } from '@/lib/firebase-admin';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function setUserVerification(uid: string, isVerified: boolean) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { isVerified });
    revalidatePath('/jtt-news');
}

export async function banUser(uid: string, isBanned: boolean) {
    await adminAuth.updateUser(uid, { disabled: isBanned });
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { isBanned });
    revalidatePath('/jtt-news');
}

export async function suspendUser(uid: string, durationHours: number) {
    const suspendedUntil = new Date();
    suspendedUntil.setHours(suspendedUntil.getHours() + durationHours);

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { 
        suspendedUntil: Timestamp.fromDate(suspendedUntil)
    });
     revalidatePath('/jtt-news');
}

export async function removeSuspension(uid: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        suspendedUntil: null
    });
    revalidatePath('/jtt-news');
}
