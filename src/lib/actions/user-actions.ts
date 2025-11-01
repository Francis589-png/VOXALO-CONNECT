
'use server';

import { db, auth as adminAuth } from '@/lib/firebase-admin';
import { doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function setUserVerification(uid: string, isVerified: boolean) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { isVerified });
    revalidatePath('/profile/[id]', 'page');
}

export async function banUser(uid: string, isBanned: boolean) {
    await adminAuth.updateUser(uid, { disabled: isBanned });
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { isBanned });
    revalidatePath('/profile/[id]', 'page');
}
