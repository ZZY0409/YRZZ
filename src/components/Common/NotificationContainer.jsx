import { useState, useEffect } from 'react';
import PointsNotification from './PointsNotification';
import LevelUpNotification from './LevelUpNotification';
import { notificationManager } from '../../services/notificationManager';

export default function NotificationContainer() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (data) => {
      const id = Date.now();
      let notification;

      switch (data.type) {
        case 'points':
          notification = (
            <PointsNotification 
              key={id}
              points={data.points} 
              reason={data.reason} 
            />
          );
          break;
        case 'levelUp':
          notification = (
            <LevelUpNotification 
              key={id}
              level={data.level}
              color={data.color}
            />
          );
          break;
      }

      if (notification) {
        setNotifications(prev => [...prev, { id, component: notification }]);
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
      }
    };

    notificationManager.subscribe(handleNotification);
    return () => notificationManager.unsubscribe(handleNotification);
  }, []);

  return (
    <div className="notifications-container">
      {notifications.map(({ id, component }) => component)}
    </div>
  );
} 