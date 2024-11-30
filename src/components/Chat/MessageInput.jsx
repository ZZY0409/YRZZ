import { useState, useRef } from 'react';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';

export default function MessageInput() {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { currentUser } = useAuth();
  const fileInputRef = useRef();

  const sendMessage = async (messageText, fileUrl = null) => {
    try {
      await addDoc(collection(db, 'messages'), {
        text: messageText,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        fileUrl: fileUrl,
        userName: currentUser.displayName || '匿名用户'
      });
      setMessage('');
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim()) {
      await sendMessage(message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileRef = ref(storage, `uploads/${currentUser.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);
      await sendMessage('', downloadUrl);
    } catch (error) {
      console.error('文件上传失败:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const onEmojiClick = (event, emojiObject) => {
    setMessage(prevMsg => prevMsg + emojiObject.emoji);
  };

  return (
    <div className="message-input">
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入消息..."
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
          >
            📎
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
          
          <button type="submit" disabled={!message.trim() && !isUploading}>
            发送
          </button>
        </div>
        
        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
      </form>
    </div>
  );
} 