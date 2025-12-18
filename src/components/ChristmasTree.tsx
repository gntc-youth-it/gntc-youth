import React from 'react';
import { RollingPaperMessage } from '../types/christmas';
import Ornament from './Ornament';
import './ChristmasTree.css';

interface ChristmasTreeProps {
  messages: RollingPaperMessage[];
  onOrnamentClick: (message: RollingPaperMessage) => void;
}

const ChristmasTree: React.FC<ChristmasTreeProps> = ({
  messages,
  onOrnamentClick,
}) => {
  return (
    <div className="tree-wrapper">
      <div className="tree-container">
        {/* 트리 꼭대기 별 - Safari 버그 우회용 wrapper */}
        <div className="tree-star-wrapper">
          <svg
            className="tree-star-svg"
            viewBox="0 0 50 50"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              className="tree-star"
              points="25,2 29,18 46,18 32,28 37,45 25,35 13,45 18,28 4,18 21,18"
              fill="#FFD700"
            />
          </svg>
        </div>

        {/* 트리 이미지 */}
        <img
          src="/tree.png"
          alt="Christmas Tree"
          className="tree-image"
        />

        {/* 오너먼트들 */}
        <div className="ornaments-container">
          {messages.map((message) => (
            <Ornament
              key={message.id}
              message={message}
              onClick={() => onOrnamentClick(message)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChristmasTree;
