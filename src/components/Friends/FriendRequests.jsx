import { useState, useEffect } from 'react';
import { db, COLLECTIONS, USER_FIELDS, CHAT_FIELDS, CHAT_TYPES } from '../../firebase/config.js';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';

export default function FriendRequests({ onClose }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    loadFriendRequests();
  }, [currentUser]);

  const loadFriendRequests = async () => {
    try {
      // 获取发给当前用户的好友请求
      const requestsRef = collection(db, COLLECTIONS.FRIEND_REQUESTS);
      const q = query(requestsRef, where('to', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      
      // 获取请求发送者的信息
      const requestsWithUser = await Promise.all(
        snapshot.docs.map(async docSnap => {
          const request = { id: docSnap.id, ...docSnap.data() };
          const userDocRef = doc(db, COLLECTIONS.USERS, request.from);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.data();
          return {
            ...request,
            user: userData
          };
        })
      );
      
      setRequests(requestsWithUser);
    } catch (error) {
      console.error('加载好友请求失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request) => {
    try {
      // 创建私聊
      const chatRef = await addDoc(collection(db, COLLECTIONS.CHATS), {
        [CHAT_FIELDS.TYPE]: CHAT_TYPES.PRIVATE,
        [CHAT_FIELDS.MEMBERS]: [currentUser.uid, request.from],
        [CHAT_FIELDS.CREATED_AT]: serverTimestamp(),
        [CHAT_FIELDS.NAME]: request.user[USER_FIELDS.DISPLAY_NAME] || '未命名用户',
        [CHAT_FIELDS.LAST_MESSAGE]: null,
        [CHAT_FIELDS.CREATED_BY]: currentUser.uid
      });

      // 删除好友请求
      await deleteDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, request.id));

      // 从列表中移除
      setRequests(requests.filter(r => r.id !== request.id));

      alert('已接受好友请求');
      onClose();
    } catch (error) {
      console.error('接受好友请求失败:', error);
      alert('操作失败');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId));
      setRequests(requests.filter(r => r.id !== requestId));
      alert('已拒绝好友请求');
    } catch (error) {
      console.error('拒绝好友请求失败:', error);
      alert('操作失败');
    }
  };

  return (
    <div className="friend-requests-modal">
      <div className="modal-content">
        <h2>好友请求</h2>
        {loading ? (
          <div>加载中...</div>
        ) : requests.length === 0 ? (
          <div>暂无好友请求</div>
        ) : (
          <div className="requests-list">
            {requests.map(request => (
              <div key={request.id} className="request-item">
                <div className="user-info">
                  <div className="user-name">
                    {request.user?.[USER_FIELDS.DISPLAY_NAME] || '未命名用户'}
                  </div>
                  <div className="user-email">{request.user?.[USER_FIELDS.EMAIL]}</div>
                </div>
                <div className="request-actions">
                  <button 
                    onClick={() => handleAccept(request)}
                    className="accept-btn"
                  >
                    接受
                  </button>
                  <button 
                    onClick={() => handleReject(request.id)}
                    className="reject-btn"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
} 