import { useEffect } from 'react';
import { db, COLLECTIONS, USER_FIELDS } from '../../firebase/config.js';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';

export default function UserPresence() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // 更新用户在线状态
    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const updateOnlineStatus = async (status) => {
      try {
        await updateDoc(userRef, {
          [USER_FIELDS.STATUS]: status,
          [USER_FIELDS.LAST_ONLINE]: serverTimestamp()
        });
      } catch (error) {
        console.error('更新在线状态失败:', error);
      }
    };

    // 页面加载时设置在线状态
    updateOnlineStatus('online');

    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      updateOnlineStatus(document.hidden ? 'away' : 'online');
    };

    // 监听页面关闭/刷新
    const handleBeforeUnload = () => {
      updateOnlineStatus('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOnlineStatus('offline');
    };
  }, [currentUser]);

  return null;
} 