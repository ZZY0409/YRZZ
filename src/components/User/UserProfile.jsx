import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, COLLECTIONS, USER_FIELDS, USER_LEVELS } from '../../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';
import UserAvatar from './UserAvatar';

export default function UserProfile({ onClose }) {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('online');
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    points: 0,
    dailyPoints: 0,
    loginStreak: 0,
    level: null
  });

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const points = userData[USER_FIELDS.POINTS] || 0;
          
          // 计算用户等级
          const level = Object.entries(USER_LEVELS)
            .reverse()
            .find(([_, levelData]) => points >= levelData.minPoints)?.[1];

          setUserStats({
            points: points,
            dailyPoints: userData[USER_FIELDS.DAILY_POINTS] || 0,
            loginStreak: userData[USER_FIELDS.LOGIN_STREAK] || 0,
            level: level
          });
        }
      } catch (error) {
        console.error('加载用户统计失败:', error);
      }
    };

    loadUserStats();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      // 更新 Firebase Auth 的 displayName
      await updateProfile(user, {
        displayName: displayName
      });

      // 更新 Firestore 中的用户资料
      const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid);
      await updateDoc(userRef, {
        [USER_FIELDS.DISPLAY_NAME]: displayName,
        [USER_FIELDS.BIO]: bio,
        [USER_FIELDS.STATUS]: status
      });

      onClose();
    } catch (error) {
      console.error('更新个人资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLevelProgress = (points) => {
    const currentLevel = Object.entries(USER_LEVELS)
      .reverse()
      .find(([_, level]) => points >= level.minPoints);
    
    const nextLevel = Object.entries(USER_LEVELS)
      .reverse()
      .find(([_, level]) => points < level.minPoints);

    if (!currentLevel || !nextLevel) return 100;

    const currentMin = currentLevel[1].minPoints;
    const nextMin = nextLevel[1].minPoints;
    const progress = ((points - currentMin) / (nextMin - currentMin)) * 100;

    return Math.min(Math.max(progress, 0), 100);
  };

  const calculateNextLevelPoints = (points) => {
    const nextLevel = Object.entries(USER_LEVELS)
      .reverse()
      .find(([_, level]) => points < level.minPoints);

    if (!nextLevel) return 0;
    return nextLevel[1].minPoints - points;
  };

  return (
    <div className="user-profile-modal">
      <div className="modal-content">
        <h2>个人资料</h2>
        <div className="profile-avatar">
          <UserAvatar size={100} />
          <div className="avatar-tip">点击头像更换</div>
        </div>

        <div className="user-stats">
          <div className="stats-item">
            <div className="stats-label">等级</div>
            <div 
              className="user-level"
              style={{ color: userStats.level?.color }}
            >
              {userStats.level?.name || '新手'}
            </div>
            <div className="level-progress">
              <div 
                className="level-progress-bar"
                style={{ 
                  width: `${calculateLevelProgress(userStats.points)}%`,
                  background: userStats.level?.color 
                }}
              />
            </div>
            <div className="level-info">
              距离下一级还需 {calculateNextLevelPoints(userStats.points)} 积分
            </div>
          </div>
          <div className="stats-item">
            <div className="stats-label">总积分</div>
            <div className="stats-value">{userStats.points}</div>
          </div>
          <div className="stats-item">
            <div className="stats-label">今日积分</div>
            <div className="stats-value">{userStats.dailyPoints}</div>
          </div>
          <div className="stats-item">
            <div className="stats-label">连续登录</div>
            <div className="stats-value">{userStats.loginStreak}天</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>昵称</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="设置你的昵称"
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label>个性签名</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="介绍一下自己吧"
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="online">在线</option>
              <option value="away">离开</option>
              <option value="busy">忙碌</option>
              <option value="offline">隐身</option>
            </select>
          </div>

          <div className="profile-info">
            <div className="info-item">
              <label>邮箱</label>
              <span>{currentUser?.email}</span>
            </div>
            <div className="info-item">
              <label>注册时间</label>
              <span>{currentUser?.metadata.creationTime}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>取消</button>
            <button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 