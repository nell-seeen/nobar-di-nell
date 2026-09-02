import { onAuthStateChanged, signInAnonymously, updateProfile } from 'firebase/auth';
import { useEffect } from 'react';
import { auth } from '../firebase/config';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If it's a new anonymous user, let's assign a Guest name
        if (firebaseUser.isAnonymous && !firebaseUser.displayName) {
          const guestName = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
          await updateProfile(firebaseUser, { displayName: guestName });
          // Reload to get updated profile
          await firebaseUser.reload();
        }
        
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Guest',
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${firebaseUser.displayName || 'G'}`,
          createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).getTime() : Date.now(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return { user, loading };
}
