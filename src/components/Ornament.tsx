import React from 'react';
import { RollingPaperMessage, OrnamentType } from '../types/christmas';
import './Ornament.css';

interface OrnamentProps {
  message: RollingPaperMessage;
  onClick: () => void;
}

// 오너먼트 타입별 SVG 아이콘
const OrnamentIcon: React.FC<{ type: OrnamentType }> = ({ type }) => {
  switch (type) {
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className="ornament-svg">
          <polygon
            points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"
            fill="#FFD700"
          />
        </svg>
      );
    case 'ball_red':
      return (
        <svg viewBox="0 0 24 24" className="ornament-svg">
          <circle cx="12" cy="13" r="9" fill="#e74c3c" />
          <rect x="10" y="2" width="4" height="4" rx="1" fill="#c9b08c" />
          <ellipse cx="9" cy="10" rx="2" ry="3" fill="rgba(255,255,255,0.3)" />
        </svg>
      );
    case 'ball_gold':
      return (
        <svg viewBox="0 0 24 24" className="ornament-svg">
          <circle cx="12" cy="13" r="9" fill="#f39c12" />
          <rect x="10" y="2" width="4" height="4" rx="1" fill="#c9b08c" />
          <ellipse cx="9" cy="10" rx="2" ry="3" fill="rgba(255,255,255,0.3)" />
        </svg>
      );
    case 'ball_blue':
      return (
        <svg viewBox="0 0 24 24" className="ornament-svg">
          <circle cx="12" cy="13" r="9" fill="#3498db" />
          <rect x="10" y="2" width="4" height="4" rx="1" fill="#c9b08c" />
          <ellipse cx="9" cy="10" rx="2" ry="3" fill="rgba(255,255,255,0.3)" />
        </svg>
      );
    case 'gift':
      return (
        <svg viewBox="0 0 24 24" className="ornament-svg">
          <rect x="3" y="10" width="18" height="12" rx="2" fill="#e74c3c" />
          <rect x="10" y="10" width="4" height="12" fill="#f39c12" />
          <rect x="3" y="7" width="18" height="5" rx="1" fill="#c0392b" />
          <rect x="10" y="7" width="4" height="5" fill="#d68910" />
          <path d="M8,7 Q12,2 12,7" stroke="#f39c12" strokeWidth="2" fill="none" />
          <path d="M16,7 Q12,2 12,7" stroke="#f39c12" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'candy':
      return (
        <svg viewBox="0 0 24 24" className="ornament-svg">
          <path
            d="M12,2 Q16,2 18,6 L18,18 Q18,22 12,22 Q6,22 6,18 L6,6 Q6,2 12,2"
            fill="#fff"
            stroke="#e74c3c"
            strokeWidth="0.5"
          />
          <path d="M8,4 L10,22" stroke="#e74c3c" strokeWidth="2" />
          <path d="M14,2 L16,20" stroke="#e74c3c" strokeWidth="2" />
        </svg>
      );
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" className="ornament-svg">
          <path
            d="M12,2 L12,4 M12,4 Q6,4 6,12 L6,16 L4,18 L20,18 L18,16 L18,12 Q18,4 12,4"
            fill="#f39c12"
            stroke="#d68910"
            strokeWidth="0.5"
          />
          <circle cx="12" cy="20" r="2" fill="#f39c12" />
          <ellipse cx="12" cy="3" rx="2" ry="1" fill="#c9b08c" />
        </svg>
      );
    case 'snowflake':
      return (
        <svg viewBox="0 0 24 24" className="ornament-svg">
          <line x1="12" y1="2" x2="12" y2="22" stroke="#fff" strokeWidth="2" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="#fff" strokeWidth="2" />
          <line x1="4" y1="4" x2="20" y2="20" stroke="#fff" strokeWidth="2" />
          <line x1="20" y1="4" x2="4" y2="20" stroke="#fff" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="#a8d8ea" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="ornament-svg">
          <circle cx="12" cy="12" r="10" fill="#e74c3c" />
        </svg>
      );
  }
};

const Ornament: React.FC<OrnamentProps> = ({ message, onClick }) => {
  const { ornamentType, position, authorName } = message;

  return (
    <button
      className={`ornament ornament-${ornamentType}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
      }}
      onClick={onClick}
      title={`${authorName}님의 메시지`}
      aria-label={`${authorName}님이 남긴 메시지 보기`}
    >
      <span className="ornament-icon">
        <OrnamentIcon type={ornamentType} />
      </span>
      <span className="ornament-glow"></span>
    </button>
  );
};

export default Ornament;
