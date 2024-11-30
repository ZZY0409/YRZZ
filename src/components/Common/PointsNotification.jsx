import { useState, useEffect } from 'react';

export default function PointsNotification({ points, reason }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="points-notification">
      <div className="points-icon">✨</div>
      <div className="points-content">
        <div className="points-value">+{points}</div>
        <div className="points-reason">{reason}</div>
      </div>
    </div>
  );
} 