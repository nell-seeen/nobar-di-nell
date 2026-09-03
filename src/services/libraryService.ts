import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface LibraryItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  type: string;
  addedAt: any;
}

export const saveToLibrary = async (userId: string, item: Omit<LibraryItem, 'id' | 'addedAt'>) => {
  const libRef = collection(db, `users/${userId}/library`);
  const newDocRef = doc(libRef);
  await setDoc(newDocRef, {
    ...item,
    id: newDocRef.id,
    addedAt: serverTimestamp()
  });
  return newDocRef.id;
};

export const removeFromLibrary = async (userId: string, itemId: string) => {
  const itemRef = doc(db, `users/${userId}/library`, itemId);
  await deleteDoc(itemRef);
};

export const getUserLibrary = async (userId: string): Promise<LibraryItem[]> => {
  const libRef = collection(db, `users/${userId}/library`);
  const q = query(libRef, orderBy('addedAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data() as LibraryItem);
};
