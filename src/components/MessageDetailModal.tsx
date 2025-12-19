import React, { useEffect } from 'react';
import { Ornament } from '../types/christmas';
import './MessageDetailModal.css';

interface MessageDetailModalProps {
  isOpen: boolean;
  ornament: Ornament | null;
  onClose: () => void;
}

const MessageDetailModal: React.FC<MessageDetailModalProps> = ({
  isOpen,
  ornament,
  onClose,
}) => {
  // ESC 키 또는 Enter 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Enter') && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ornament) return null;

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div
        className="detail-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-modal-decoration">
          <span className="detail-modal-holly left"></span>
          <span className="detail-modal-holly right"></span>
        </div>

        <div className="detail-modal-header">
          <span className="detail-modal-author">{ornament.writerName}</span>
        </div>

        <div className="detail-modal-body">
          <p className="detail-modal-message">{ornament.message}</p>
        </div>

        <button className="detail-modal-close" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
};

export default MessageDetailModal;
