import { useState, useEffect } from 'react';
import { db, COLLECTIONS, CHAT_FIELDS, MEMBER_FIELDS, USER_FIELDS } from '../../firebase/config.js';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  getDocs, 
  where, 
  arrayUnion, 
  deleteDoc, 
  arrayRemove, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext.jsx';

export default function GroupSettings({ chat, onClose }) {
  const [groupName, setGroupName] = useState(chat[CHAT_FIELDS.NAME]);
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        // 获取成员列表
        const membersRef = collection(db, COLLECTIONS.CHATS, chat.id, 'members');
        const snapshot = await getDocs(membersRef);
        const membersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMembers(membersList);

        // 检查当前用户是否是管理员
        const currentMember = membersList.find(m => m.id === currentUser.uid);
        setIsAdmin(currentMember?.[MEMBER_FIELDS.ROLE] === 'admin');
      } catch (error) {
        console.error('加载成员失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [chat.id, currentUser.uid]);

  const handleUpdateGroupName = async () => {
    if (!isAdmin || !groupName.trim()) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.CHATS, chat.id), {
        [CHAT_FIELDS.NAME]: groupName.trim()
      });
    } catch (error) {
      console.error('更新群名失败:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!isAdmin || memberId === currentUser.uid) return;
    try {
      // 从成员子集合中删除
      await deleteDoc(doc(db, COLLECTIONS.CHATS, chat.id, 'members', memberId));
      // 更新群聊的成员列表
      await updateDoc(doc(db, COLLECTIONS.CHATS, chat.id), {
        [CHAT_FIELDS.MEMBERS]: arrayRemove(memberId)
      });
      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      console.error('移除成员失败:', error);
    }
  };

  const handleSetAdmin = async (memberId) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.CHATS, chat.id, 'members', memberId), {
        [MEMBER_FIELDS.ROLE]: 'admin'
      });
      setMembers(members.map(m => 
        m.id === memberId 
          ? { ...m, [MEMBER_FIELDS.ROLE]: 'admin' }
          : m
      ));
    } catch (error) {
      console.error('设置管理员失败:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setInviteLoading(true);
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef,
        where(USER_FIELDS.EMAIL, '>=', searchTerm.trim()),
        where(USER_FIELDS.EMAIL, '<=', searchTerm.trim() + '\uf8ff')
      );
      
      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => 
          user.id !== currentUser.uid && 
          !members.some(m => m.id === user.id)
        );
      
      setSearchResults(users);
    } catch (error) {
      console.error('搜索用户失败:', error);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInvite = async (userId, userEmail, userName) => {
    try {
      // 添加到成员子集合
      await setDoc(doc(db, COLLECTIONS.CHATS, chat.id, 'members', userId), {
        [MEMBER_FIELDS.ROLE]: 'member',
        [MEMBER_FIELDS.JOINED_AT]: serverTimestamp(),
        [MEMBER_FIELDS.NICKNAME]: userName || '未命名用户',
        email: userEmail
      });

      // 更新群聊的成员列表
      await updateDoc(doc(db, COLLECTIONS.CHATS, chat.id), {
        [CHAT_FIELDS.MEMBERS]: arrayUnion(userId)
      });

      // 更新本地成员列表
      setMembers([...members, {
        id: userId,
        [MEMBER_FIELDS.ROLE]: 'member',
        [MEMBER_FIELDS.JOINED_AT]: new Date(),
        [MEMBER_FIELDS.NICKNAME]: userName || '未命名用户',
        email: userEmail
      }]);

      // 清除搜索结果
      setSearchResults(searchResults.filter(user => user.id !== userId));
    } catch (error) {
      console.error('邀请用户失败:', error);
    }
  };

  return (
    <div className="group-settings-modal">
      <div className="modal-content">
        <h2>群聊设置</h2>
        {loading ? (
          <div>加载中...</div>
        ) : (
          <>
            {isAdmin && (
              <div className="form-group">
                <label>群名称:</label>
                <div className="group-name-input">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <button onClick={handleUpdateGroupName}>
                    更新
                  </button>
                </div>
              </div>
            )}

            <div className="members-list">
              <div className="members-header">
                <h3>群成员 ({members.length})</h3>
                <button 
                  className="invite-btn"
                  onClick={() => setShowInvite(!showInvite)}
                >
                  邀请新成员
                </button>
              </div>

              {showInvite && (
                <div className="invite-section">
                  <div className="search-container">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="输入邮箱搜索用户"
                    />
                    <button 
                      onClick={handleSearch}
                      disabled={inviteLoading}
                    >
                      {inviteLoading ? '搜索中...' : '搜索'}
                    </button>
                  </div>

                  <div className="search-results">
                    {searchResults.map(user => (
                      <div key={user.id} className="user-item">
                        <div className="user-info">
                          <div className="user-name">
                            {user[USER_FIELDS.DISPLAY_NAME] || '未命名用户'}
                          </div>
                          <div className="user-email">{user[USER_FIELDS.EMAIL]}</div>
                        </div>
                        <button 
                          onClick={() => handleInvite(
                            user.id, 
                            user[USER_FIELDS.EMAIL],
                            user[USER_FIELDS.DISPLAY_NAME]
                          )}
                          className="invite-user-btn"
                        >
                          邀请
                        </button>
                      </div>
                    ))}
                    {searchResults.length === 0 && searchTerm && !inviteLoading && (
                      <div className="no-results">未找到用户</div>
                    )}
                  </div>
                </div>
              )}

              {members.map(member => (
                <div key={member.id} className="member-item">
                  <div className="member-info">
                    <span className="member-name">
                      {member[MEMBER_FIELDS.NICKNAME]}
                      {member[MEMBER_FIELDS.ROLE] === 'admin' && 
                        <span className="admin-badge">管理员</span>
                      }
                      {member.id === currentUser.uid && 
                        <span className="self-badge">（我）</span>
                      }
                    </span>
                    <span className="member-email">{member.email}</span>
                  </div>
                  {isAdmin && member.id !== currentUser.uid && (
                    <div className="member-actions">
                      {member[MEMBER_FIELDS.ROLE] !== 'admin' && (
                        <button onClick={() => handleSetAdmin(member.id)}>
                          设为管理员
                        </button>
                      )}
                      <button 
                        onClick={() => handleRemoveMember(member.id)}
                        className="remove-btn"
                      >
                        移除
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={onClose}>关闭</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 