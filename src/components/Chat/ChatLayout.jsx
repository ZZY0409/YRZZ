import { useState } from 'react';
import ChatList from './ChatList';
import ChatRoom from './ChatRoom';
import CatAnimation from '../Common/CatAnimation';
import ThemeSettings from '../Settings/ThemeSettings';
import { useTheme } from '../../context/ThemeContext';
import SocialLinks from '../Common/SocialLinks';

export default function ChatLayout() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const { theme } = useTheme();

  return (
    <div className={`chat-layout theme-${theme}`}>
      <CatAnimation theme={theme} />
      <SocialLinks />
      <button 
        className="theme-btn"
        onClick={() => setShowSettings(true)}
        title="更换主题"
      >
        <span className="theme-icon">🎨</span>
        <span className="theme-tooltip">更换主题</span>
      </button>
      <ChatList onChatSelect={setSelectedChat} />
      <div className="chat-main">
        {selectedChat ? (
          <ChatRoom chat={selectedChat} />
        ) : (
          <div className="no-chat-selected">
            选择一个聊天开始吧 👋
          </div>
        )}
      </div>
      {showSettings && (
        <ThemeSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
} 