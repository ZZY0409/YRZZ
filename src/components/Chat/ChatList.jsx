import { useState, useEffect } from 'react';
import { db, COLLECTIONS, CHAT_FIELDS, CHAT_TYPES, USER_FIELDS, USER_LEVELS } from '../../firebase/config.js';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';
import CreateGroupChat from './CreateGroupChat';
import AddFriend from '../Friends/AddFriend';
import UserProfile from '../User/UserProfile';
import UserAvatar from '../User/UserAvatar';
import FriendRequests from '../Friends/FriendRequests';
import MomentsList from '../Moments/MomentsList';
import RankingList from '../Rankings/RankingList';

export default function ChatList({ onChatSelect }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const { currentUser } = useAuth();

  // 添加搜索状态
  const [searchText, setSearchText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [requestCount, setRequestCount] = useState(0);  // 添加请求计数
  const [userStatuses, setUserStatuses] = useState({});
  const [showMoments, setShowMoments] = useState(false);
  const [showRankings, setShowRankings] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // 获取用户参与的所有聊天
    const chatsRef = collection(db, COLLECTIONS.CHATS);
    const q = query(
      chatsRef,
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 监听用户资料变化
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data());
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 监听好友请求数量
  useEffect(() => {
    if (!currentUser) return;

    const requestsRef = collection(db, COLLECTIONS.FRIEND_REQUESTS);
    const q = query(requestsRef, where('to', '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequestCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 监听所有聊天成员的在线状态
  useEffect(() => {
    if (!currentUser || !chats.length) return;

    // 获取所有私聊的用户ID
    const userIds = chats
      .filter(chat => chat[CHAT_FIELDS.TYPE] === CHAT_TYPES.PRIVATE)
      .map(chat => chat[CHAT_FIELDS.MEMBERS].find(id => id !== currentUser.uid));

    // 监听每个用户的状态
    const unsubscribes = userIds.map(userId => {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUserStatuses(prev => ({
            ...prev,
            [userId]: doc.data()[USER_FIELDS.STATUS] || 'offline'
          }));
        }
      });
    });

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [currentUser, chats]);

  const handleChatSelect = (chat) => {
    setActiveChat(chat.id);
    onChatSelect(chat);
  };

  // 过滤聊天列表
  const filteredChats = chats.filter(chat => {
    // 如果没有搜索文本，显示所有聊天
    if (!searchText) return true;

    // 获取聊天名称
    let chatName = '';
    if (chat[CHAT_FIELDS.TYPE] === CHAT_TYPES.PRIVATE) {
      // 如果是私聊，使用对方的名字
      const otherUserId = chat[CHAT_FIELDS.MEMBERS].find(id => id !== currentUser.uid);
      const otherUser = userStatuses[otherUserId];
      chatName = otherUser?.[USER_FIELDS.DISPLAY_NAME] || chat[CHAT_FIELDS.NAME] || '未命名用户';
    } else {
      // 如果是群聊，使用群名
      chatName = chat[CHAT_FIELDS.NAME] || '未命名群聊';
    }

    // 进行搜索匹配
    return chatName.toLowerCase().includes(searchText.toLowerCase());
  });

  return (
    <div className="chat-list">
      <div className="chat-header">
        <div className="user-info" onClick={() => setShowProfile(true)}>
          <UserAvatar size={32} />
          <div className="user-status">
            <div className="user-name">
              {userProfile?.[USER_FIELDS.DISPLAY_NAME] || currentUser?.displayName || '未命名用户'}
              {userProfile?.[USER_FIELDS.LEVEL] && (
                <span 
                  className="user-level-badge"
                  style={{ color: USER_LEVELS[userProfile[USER_FIELDS.LEVEL]]?.color }}
                >
                  {USER_LEVELS[userProfile[USER_FIELDS.LEVEL]]?.name}
                </span>
              )}
            </div>
            <div className="status-text">
              <div className={`status-indicator status-${userProfile?.[USER_FIELDS.STATUS] || 'online'}`} />
              {userProfile?.[USER_FIELDS.BIO] || '这个人很懒，什么都没写'}
            </div>
          </div>
        </div>
        <input
          type="text"
          placeholder="搜索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="chat-actions">
        <button 
          className="action-btn"
          onClick={() => setShowAddFriend(true)}
        >
          <span className="action-icon">👤</span>
          <span className="action-text">添加好友</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowCreateGroup(true)}
        >
          <span className="action-icon">👥</span>
          <span className="action-text">创建群聊</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowFriendRequests(true)}
        >
          <span className="action-icon">
            🔔
            {requestCount > 0 && (
              <span className="notification-badge">{requestCount}</span>
            )}
          </span>
          <span className="action-text">好友请求</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowMoments(true)}
        >
          <span className="action-icon">📱</span>
          <span className="action-text">朋友圈</span>
        </button>
        <button 
          className="action-btn"
          onClick={() => setShowRankings(true)}
        >
          <span className="action-icon">🏆</span>
          <span className="action-text">排行榜</span>
        </button>
      </div>

      <div className="chat-list-content">
        {filteredChats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${activeChat === chat.id ? 'active' : ''}`}
            onClick={() => handleChatSelect(chat)}
          >
            <div className="chat-item-avatar">
              {chat[CHAT_FIELDS.TYPE] === CHAT_TYPES.PRIVATE && (
                <div className={`status-dot status-${
                  userStatuses[chat[CHAT_FIELDS.MEMBERS].find(id => id !== currentUser.uid)]
                }`} />
              )}
              {chat.photoURL ? (
                <img src={chat.photoURL} alt={chat[CHAT_FIELDS.NAME] || '聊天'} />
              ) : (
                chat[CHAT_FIELDS.TYPE] === CHAT_TYPES.GROUP ? '👥' : '👤'
              )}
            </div>
            <div className="chat-item-info">
              <div className="chat-item-name">
                {chat[CHAT_FIELDS.TYPE] === CHAT_TYPES.PRIVATE ? (
                  // 显示私聊对象的名字
                  userStatuses[chat[CHAT_FIELDS.MEMBERS].find(id => id !== currentUser.uid)]?.[USER_FIELDS.DISPLAY_NAME] || 
                  chat[CHAT_FIELDS.NAME] || 
                  '未命名用户'
                ) : (
                  // 显示群聊名称
                  chat[CHAT_FIELDS.NAME] || '未命名群聊'
                )}
              </div>
              <div className="chat-item-last-message">
                {chat[CHAT_FIELDS.LAST_MESSAGE]?.text || '暂无消息'}
              </div>
            </div>
            <div className="chat-item-meta">
              {chat[CHAT_FIELDS.LAST_MESSAGE]?.createdAt?.toDate().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}
      </div>

      {showAddFriend && (
        <AddFriend onClose={() => setShowAddFriend(false)} />
      )}
      {showCreateGroup && (
        <CreateGroupChat onClose={() => setShowCreateGroup(false)} />
      )}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
      {showFriendRequests && (
        <FriendRequests onClose={() => setShowFriendRequests(false)} />
      )}
      {showMoments && (
        <MomentsList onClose={() => setShowMoments(false)} />
      )}
      {showRankings && (
        <RankingList onClose={() => setShowRankings(false)} />
      )}
    </div>
  );
} 