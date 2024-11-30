import { useState } from 'react';
import { db, COLLECTIONS } from '../../firebase/config.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AddFriend({ onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // 查找用户
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, where('email', '==', email.trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert('未找到该用户');
        return;
      }

      const targetUser = snapshot.docs[0];
      
      // 检查是否是自己
      if (targetUser.id === currentUser.uid) {
        alert('不能添加自己为好友');
        return;
      }

      // 检查是否已经是好友
      const chatsRef = collection(db, COLLECTIONS.CHATS);
      const chatsQuery = query(
        chatsRef,
        where('type', '==', 'private'),
        where('members', 'array-contains', currentUser.uid)
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      
      const isAlreadyFriend = chatsSnapshot.docs.some(doc => {
        const members = doc.data().members;
        return members.includes(targetUser.id);
      });

      if (isAlreadyFriend) {
        alert('该用户已经是你的好友');
        return;
      }

      // 检查是否已经发送过请求
      const requestsRef = collection(db, COLLECTIONS.FRIEND_REQUESTS);
      const requestsQuery = query(
        requestsRef,
        where('from', '==', currentUser.uid),
        where('to', '==', targetUser.id)
      );
      const requestsSnapshot = await getDocs(requestsQuery);

      if (!requestsSnapshot.empty) {
        alert('已经发送过好友请求，请等待对方回应');
        return;
      }

      // 检查对方是否已经发送请求给你
      const reverseRequestsQuery = query(
        requestsRef,
        where('from', '==', targetUser.id),
        where('to', '==', currentUser.uid)
      );
      const reverseRequestsSnapshot = await getDocs(reverseRequestsQuery);

      if (!reverseRequestsSnapshot.empty) {
        alert('对方已经发送好友请求给你，请在好友请求中查看');
        return;
      }

      // 发送好友请求
      await addDoc(requestsRef, {
        from: currentUser.uid,
        to: targetUser.id,
        createdAt: serverTimestamp(),
        status: 'pending'  // 添加状态字段
      });

      alert('好友请求已发送');
      onClose();
    } catch (error) {
      console.error('添加好友失败:', error);
      alert('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-friend-modal">
      <div className="modal-content">
        <h2>添加好友</h2>
        <form onSubmit={handleSubmit}>
          <div className="search-container">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="输入邮箱搜索"
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>
        </form>
        <div className="modal-actions">
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
} 