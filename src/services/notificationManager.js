import { createRoot } from 'react-dom/client';

class NotificationManager {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
  }

  unsubscribe(listener) {
    this.listeners.delete(listener);
  }

  showPoints(points, reason) {
    this.listeners.forEach(listener => {
      listener({ type: 'points', points, reason });
    });
  }

  showLevelUp(level, color) {
    this.listeners.forEach(listener => {
      listener({ type: 'levelUp', level, color });
    });
  }
}

export const notificationManager = new NotificationManager(); 