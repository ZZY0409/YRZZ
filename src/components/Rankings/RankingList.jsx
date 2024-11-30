import { useState, useEffect } from 'react';
import { db, COLLECTIONS, USER_FIELDS } from '../../firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import UserAvatar from '../User/UserAvatar';

export default function RankingList({ onClose }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        const usersRef = collection(db, COLLECTIONS.USERS);
        const q = query(
          usersRef,
          orderBy(USER_FIELDS.POINTS, 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        setRankings(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      } catch (error) {
        console.error('加载排行榜失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, []);

  return (
    <div className="rankings-modal">
      <div className="modal-content">
        <h2>积分排行榜</h2>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="rankings-list">
            {rankings.map((user, index) => (
              <div key={user.id} className="ranking-item">
                <div className="ranking-number">
                  {index + 1}
                </div>
                <UserAvatar userId={user.id} size={40} />
                <div className="user-info">
                  <div className="user-name">
                    {user[USER_FIELDS.DISPLAY_NAME]}
                  </div>
                  <div className="user-level" style={{ color: user.level?.color }}>
                    {user[USER_FIELDS.LEVEL] || '新手'}
                  </div>
                </div>
                <div className="user-points">
                  {user[USER_FIELDS.POINTS] || 0} 分
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