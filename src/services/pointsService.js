import { db, COLLECTIONS, USER_FIELDS, POINT_RULES, USER_LEVELS } from '../firebase/config';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { notificationManager } from './notificationManager';

export const pointsService = {
  // 处理登录积分
  async handleLoginPoints(userId) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    const now = new Date();
    const lastLogin = userData[USER_FIELDS.LAST_LOGIN]?.toDate() || new Date(0);
    const isNewDay = now.getDate() !== lastLogin.getDate();
    const isConsecutive = (now - lastLogin) < (24 * 60 * 60 * 1000);
    
    if (isNewDay) {
      let points = POINT_RULES.LOGIN.DAILY_FIRST;
      let streak = isConsecutive ? 
        Math.min(userData[USER_FIELDS.LOGIN_STREAK] + 1, POINT_RULES.LOGIN.MAX_CONTINUOUS) : 1;
      
      if (streak > 1) {
        points += POINT_RULES.LOGIN.CONTINUOUS * (streak - 1);
      }

      await updateDoc(userRef, {
        [USER_FIELDS.POINTS]: increment(points),
        [USER_FIELDS.DAILY_POINTS]: 0,
        [USER_FIELDS.LAST_LOGIN]: now,
        [USER_FIELDS.LOGIN_STREAK]: streak
      });

      if (points > 0) {
        this.showPointsNotification(points, `每日登录 +${POINT_RULES.LOGIN.DAILY_FIRST}${
          streak > 1 ? `，连续登录 +${POINT_RULES.LOGIN.CONTINUOUS * (streak - 1)}` : ''
        }`);
      }

      return points;
    }
    
    return 0;
  },

  // 处理消息积分
  async handleMessagePoints(userId) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    const dailyPoints = userDoc.data()[USER_FIELDS.DAILY_POINTS] || 0;

    if (dailyPoints < POINT_RULES.CHAT.DAILY_MAX) {
      await updateDoc(userRef, {
        [USER_FIELDS.POINTS]: increment(POINT_RULES.CHAT.SEND_MESSAGE),
        [USER_FIELDS.DAILY_POINTS]: increment(POINT_RULES.CHAT.SEND_MESSAGE)
      });
      return POINT_RULES.CHAT.SEND_MESSAGE;
    }
    
    return 0;
  },

  // 处理朋友圈积分
  async handleMomentPoints(userId, action) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    const dailyPoints = userDoc.data()[USER_FIELDS.DAILY_POINTS] || 0;
    
    let points = 0;
    switch (action) {
      case 'post':
        points = POINT_RULES.MOMENTS.POST;
        break;
      case 'comment':
        points = POINT_RULES.MOMENTS.COMMENT;
        break;
      case 'like':
        points = POINT_RULES.MOMENTS.LIKE;
        break;
    }

    if (dailyPoints < POINT_RULES.MOMENTS.DAILY_MAX) {
      await updateDoc(userRef, {
        [USER_FIELDS.POINTS]: increment(points),
        [USER_FIELDS.DAILY_POINTS]: increment(points)
      });
      return points;
    }
    
    return 0;
  },

  // 获取用户等级
  async getUserLevel(userId) {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    const points = userDoc.data()[USER_FIELDS.POINTS] || 0;
    
    return Object.entries(USER_LEVELS)
      .reverse()
      .find(([_, level]) => points >= level.minPoints)?.[1];
  },

  // 显示积分通知
  showPointsNotification(points, reason) {
    notificationManager.showPoints(points, reason);
  },

  async checkLevelUp(userId, oldPoints, newPoints) {
    const oldLevel = Object.entries(USER_LEVELS)
      .reverse()
      .find(([_, level]) => oldPoints >= level.minPoints)?.[1];
    
    const newLevel = Object.entries(USER_LEVELS)
      .reverse()
      .find(([_, level]) => newPoints >= level.minPoints)?.[1];

    if (newLevel && (!oldLevel || newLevel.name !== oldLevel.name)) {
      notificationManager.showLevelUp(newLevel.name, newLevel.color);
      
      // 更新用户等级
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        [USER_FIELDS.LEVEL]: newLevel.name
      });
    }
  },

  async addPoints(userId, points, reason) {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const oldPoints = userData[USER_FIELDS.POINTS] || 0;
    const dailyPoints = userData[USER_FIELDS.DAILY_POINTS] || 0;

    await updateDoc(userRef, {
      [USER_FIELDS.POINTS]: increment(points),
      [USER_FIELDS.DAILY_POINTS]: increment(points)
    });

    // 检查等级变化
    await this.checkLevelUp(userId, oldPoints, oldPoints + points);

    // 显示积分通知
    notificationManager.showPoints(points, reason);

    return points;
  }
}; 