import { useState } from 'react';
import { DEFAULT_LINKS } from '../../firebase/config.js';

export default function SocialLinks() {
  const [hoveredLink, setHoveredLink] = useState(null);

  return (
    <div className="social-links">
      {Object.values(DEFAULT_LINKS).map(link => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          onMouseEnter={() => setHoveredLink(link.name)}
          onMouseLeave={() => setHoveredLink(null)}
          style={{
            '--link-color': link.color,
            transform: hoveredLink === link.name ? 'scale(1.2)' : 'scale(1)'
          }}
        >
          <span className="social-icon">{link.icon}</span>
          <span className="social-name">{link.name}</span>
        </a>
      ))}
    </div>
  );
} 