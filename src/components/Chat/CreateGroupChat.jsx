import { useState } from 'react';
import { db, COLLECTIONS, CHAT_FIELDS, CHAT_TYPES, MEMBER_FIELDS } from '../../firebase/config.js';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';

export default function CreateGroupChat({ onClose }) {
  const [groupName, setGroupName] = useState('');
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setLoading(true);
    try {
      // 创建群聊文档
      const chatRef = await addDoc(collection(db, COLLECTIONS.CHATS), {
        [CHAT_FIELDS.NAME]: groupName.trim(),
        [CHAT_FIELDS.TYPE]: CHAT_TYPES.GROUP,
        [CHAT_FIELDS.CREATED_AT]: serverTimestamp(),
        [CHAT_FIELDS.CREATED_BY]: currentUser.uid,
        [CHAT_FIELDS.LAST_MESSAGE]: null,
        [CHAT_FIELDS.MEMBERS]: [currentUser.uid]  // 初始成员列表
      });

      // 在子集合中添加创建者作为管理员
      await setDoc(
        doc(db, COLLECTIONS.CHATS, chatRef.id, 'members', currentUser.uid),
        {
          [MEMBER_FIELDS.ROLE]: 'admin',
          [MEMBER_FIELDS.JOINED_AT]: serverTimestamp(),
          [MEMBER_FIELDS.NICKNAME]: currentUser.displayName || '未命名用户',
          email: currentUser.email,
          photoURL: currentUser.photoURL
        }
      );

      console.log('群聊创建成功:', chatRef.id);
      onClose();
    } catch (error) {
      console.error('创建群聊失败:', error);
      alert('创建群聊失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-group-modal">
      <div className="modal-content">
        <h2>创建新群聊</h2>
        <form onSubmit={handleCreateGroup}>
          <div className="form-group">
            <label>群名称:</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="输入群名称"
              required
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
            >
              取消
            </button>
            <button 
              type="submit"
              disabled={loading || !groupName.trim()}
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 