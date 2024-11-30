import { useState, useEffect } from 'react';

export default function LevelUpNotification({ level, color }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="level-up-notification">
      <div className="level-up-icon">🎉</div>
      <div className="level-up-content">
        <div className="level-up-title">恭喜升级！</div>
        <div 
          className="level-up-level"
          style={{ color }}
        >
          {level}
        </div>
      </div>
    </div>
  );
} 