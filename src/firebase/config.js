import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { browserLocalPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDxO3DpmJCukazUP4Fo4N2gWEC6CkjJdRI",
  authDomain: "yrzz-c0e70.firebaseapp.com",
  projectId: "yrzz-c0e70",
  storageBucket: "yrzz-c0e70.firebasestorage.app",
  messagingSenderId: "941583122812",
  appId: "1:941583122812:web:ce1869fa36739fa11024f9",
  measurementId: "G-JVY1MHBB3T"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 配置 Google 登录
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 设置持久化登录
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error('持久化登录设置失败:', error);
});

// 集合和子集合定义
const COLLECTIONS = {
  CHATS: 'chats',
  USERS: 'users',
  FRIEND_REQUESTS: 'friendRequests',
  MOMENTS: 'moments',
  NOTIFICATIONS: 'notifications',
  CUSTOM_LINKS: 'customLinks'
};

// 文档字段定义
const CHAT_FIELDS = {
  TYPE: 'type',
  NAME: 'name',
  CREATED_AT: 'createdAt',
  LAST_MESSAGE: 'lastMessage',
  CREATED_BY: 'createdBy',
  MEMBERS: 'members'
};

const MESSAGE_FIELDS = {
  TEXT: 'text',
  FROM: 'from',
  CREATED_AT: 'createdAt',
  TYPE: 'type',
  FILE_URL: 'fileUrl'
};

const USER_FIELDS = {
  EMAIL: 'email',
  DISPLAY_NAME: 'displayName',
  PHOTO_URL: 'photoURL',
  CREATED_AT: 'createdAt',
  LAST_ONLINE: 'lastOnline',
  STATUS: 'status',
  BIO: 'bio',
  POINTS: 'points',
  DAILY_POINTS: 'dailyPoints',
  LAST_LOGIN: 'lastLogin',
  LOGIN_STREAK: 'loginStreak',
  LEVEL: 'level'
};

const CHAT_TYPES = {
  GROUP: 'group',
  PRIVATE: 'private'
};

const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away'
};

// 积分规则
const POINT_RULES = {
  LOGIN: {
    DAILY_FIRST: 10,    // 每日首次登录
    CONTINUOUS: 5,      // 连续登录额外奖励
    MAX_CONTINUOUS: 7   // 最大连续登录天数
  },
  CHAT: {
    SEND_MESSAGE: 1,    // 发送消息
    DAILY_MAX: 50      // 每日最大获取积分数
  },
  MOMENTS: {
    POST: 5,           // 发布动态
    COMMENT: 2,        // 评论
    LIKE: 1,           // 点赞
    DAILY_MAX: 100     // 每日最大获取积分数
  }
};

// 用户等级定义
const USER_LEVELS = {
  NOVICE: {
    name: '新手',
    minPoints: 0,
    color: '#95a5a6'
  },
  REGULAR: {
    name: '常客',
    minPoints: 100,
    color: '#3498db'
  },
  ACTIVE: {
    name: '活跃',
    minPoints: 500,
    color: '#2ecc71'
  },
  EXPERT: {
    name: '专家',
    minPoints: 2000,
    color: '#f1c40f'
  },
  MASTER: {
    name: '大师',
    minPoints: 10000,
    color: '#e74c3c'
  }
};

// 导出所有内容
export {
  auth,
  db,
  storage,
  googleProvider,
  COLLECTIONS,
  CHAT_FIELDS,
  MESSAGE_FIELDS,
  USER_FIELDS,
  CHAT_TYPES,
  USER_STATUS,
  POINT_RULES,
  USER_LEVELS
}; 