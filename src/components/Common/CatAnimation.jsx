import { useState, useEffect } from 'react';

export default function CatAnimation({ theme = 'light' }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const moveRandomly = () => {
      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 100;
      
      setPosition({
        x: Math.random() * maxX,
        y: Math.random() * maxY
      });
      setIsMoving(true);
      
      setTimeout(() => setIsMoving(false), 2000);
    };

    const interval = setInterval(moveRandomly, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (!isJumping && !isSpinning) {
      const action = Math.random() > 0.5 ? 'jump' : 'spin';
      if (action === 'jump') {
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 500);
      } else {
        setIsSpinning(true);
        setTimeout(() => setIsSpinning(false), 800);
      }
    }
  };

  return (
    <div 
      className={`cat-animation ${isMoving ? 'moving' : ''} ${isJumping ? 'jumping' : ''} ${isSpinning ? 'spinning' : ''} theme-${theme}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
      onClick={handleClick}
    >
      <div className="cat-head">
        <div className="cat-ears">
          <div className="ear left"></div>
          <div className="ear right"></div>
        </div>
        <div className="cat-face">
          <div className="eyes">
            <div className="eye left"></div>
            <div className="eye right"></div>
          </div>
          <div className="cheeks">
            <div className="cheek left"></div>
            <div className="cheek right"></div>
          </div>
          <div className="nose"></div>
          <div className="mouth"></div>
        </div>
        <div className="collar">
          <div className="bell"></div>
        </div>
      </div>
    </div>
  );
} 