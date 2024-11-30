import { useState, useEffect, useRef } from 'react';
import { db, COLLECTIONS, MESSAGE_FIELDS, CHAT_FIELDS, CHAT_TYPES, USER_FIELDS } from '../../firebase/config.js';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';
import GroupSettings from './GroupSettings';
import UserAvatar from '../User/UserAvatar';
import { pointsService } from '../../services/pointsService';

export default function ChatRoom({ chat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [chatUser, setChatUser] = useState(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 检查是否需要自动滚动
  const shouldScrollToBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // 如果用户已经滚动到接近底部，或者是首次加载，就自动滚动
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  useEffect(() => {
    if (!chat?.id) return;

    // 获取特定聊天的消息子集合
    const messagesRef = collection(db, COLLECTIONS.CHATS, chat.id, 'messages');
    const q = query(
      messagesRef,
      orderBy(MESSAGE_FIELDS.CREATED_AT, 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shouldScroll = shouldScrollToBottom();
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMessages(newMessages);
      setLoading(false);
      
      if (shouldScroll) {
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => unsubscribe();
  }, [chat?.id]);

  // 获取私聊对象的信息
  useEffect(() => {
    if (!chat?.id || chat[CHAT_FIELDS.TYPE] !== CHAT_TYPES.PRIVATE) return;

    const userId = chat[CHAT_FIELDS.MEMBERS].find(id => id !== currentUser.uid);
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setChatUser(doc.data());
      }
    });

    return () => unsubscribe();
  }, [chat?.id, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat?.id) return;

    try {
      // 添加消息到聊天的消息子集合
      const messagesRef = collection(db, COLLECTIONS.CHATS, chat.id, 'messages');
      await addDoc(messagesRef, {
        [MESSAGE_FIELDS.TEXT]: newMessage,
        [MESSAGE_FIELDS.FROM]: currentUser.uid,
        [MESSAGE_FIELDS.CREATED_AT]: serverTimestamp(),
        [MESSAGE_FIELDS.TYPE]: 'text'
      });

      // 更新聊天的最后一条消息
      await updateDoc(doc(db, COLLECTIONS.CHATS, chat.id), {
        [CHAT_FIELDS.LAST_MESSAGE]: {
          text: newMessage,
          createdAt: serverTimestamp()
        }
      });

      setNewMessage('');
      scrollToBottom();

      // 处理发送消息积分
      const points = await pointsService.handleMessagePoints(currentUser.uid);
      if (points > 0) {
        // 可以添加一个小提示
        console.log(`发送消息 +${points} 积分`);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">
          {chat[CHAT_FIELDS.TYPE] === CHAT_TYPES.PRIVATE ? (
            <div className="private-chat-header">
              <div className="user-name">
                {chatUser?.[USER_FIELDS.DISPLAY_NAME] || '未命名用户'}
              </div>
              <div className="user-status">
                <div className={`status-indicator status-${chatUser?.[USER_FIELDS.STATUS] || 'offline'}`} />
                {chatUser?.[USER_FIELDS.STATUS] || 'offline'}
              </div>
            </div>
          ) : (
            chat?.name
          )}
        </div>
        {chat?.[CHAT_FIELDS.TYPE] === CHAT_TYPES.GROUP && (
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(true)}
          >
            ⚙️
          </button>
        )}
      </div>
      
      <div className="messages-container" ref={messagesContainerRef}>
        {loading ? (
          <div className="loading">加载消息中...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">还没有任何消息，开始聊天吧！</div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id}
              className={`message ${msg[MESSAGE_FIELDS.FROM] === currentUser.uid ? 'sent' : 'received'}`}
            >
              <div className="message-header">
                <UserAvatar 
                  size={24} 
                  userId={msg[MESSAGE_FIELDS.FROM]}
                />
                <span className="username">
                  {msg[MESSAGE_FIELDS.FROM] === currentUser.uid ? '我' : chatUser?.[USER_FIELDS.DISPLAY_NAME] || '未命名用户'}
                </span>
                <span className="time">
                  {msg[MESSAGE_FIELDS.CREATED_AT]?.toDate().toLocaleString()}
                </span>
              </div>
              <div className="message-content">
                {msg[MESSAGE_FIELDS.TEXT]}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-container">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="输入消息..."
            maxLength={1000}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button type="submit">发送</button>
        </div>
      </form>

      {showSettings && (
        <GroupSettings 
          chat={chat} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
} 