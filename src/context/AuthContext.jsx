import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db, COLLECTIONS, USER_FIELDS } from '../firebase/config';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { pointsService } from '../services/pointsService';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
          [USER_FIELDS.EMAIL]: user.email,
          [USER_FIELDS.DISPLAY_NAME]: user.displayName || '未命名用户',
          [USER_FIELDS.PHOTO_URL]: user.photoURL,
          [USER_FIELDS.CREATED_AT]: serverTimestamp()
        }, { merge: true });

        const points = await pointsService.handleLoginPoints(user.uid);
        if (points > 0) {
          alert(`登录奖励 +${points} 积分！`);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const loginWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error.code === 'auth/popup-blocked') {
        return signInWithRedirect(auth, googleProvider);
      }
      throw error;
    }
  };

  const loginWithFacebook = async () => {
    const provider = new FacebookAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithFacebook
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 