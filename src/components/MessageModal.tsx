import React, { useState, useEffect, useRef } from 'react';
import './MessageModal.css';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => void;
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_LENGTH = 200;

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      // 모달 열릴 때 textarea에 포커스
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (message.trim()) {
      onConfirm(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter로 제출
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && message.trim()) {
      handleConfirm();
    }
  };

  return (
    <div className="message-modal-overlay" onClick={onClose}>
      <div
        className="message-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="message-modal-header">
          <h2 className="message-modal-title">메시지 남기기</h2>
          <button className="message-modal-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="message-modal-description">
          트리에 걸릴 특별한 메시지를 남겨주세요
        </p>

        <textarea
          ref={textareaRef}
          className="message-modal-textarea"
          placeholder="따뜻한 메시지를 남겨주세요..."
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
        />

        <div className="message-modal-footer">
          <span className="message-modal-char-count">
            {message.length}/{MAX_LENGTH}
          </span>
          <div className="message-modal-buttons">
            <button className="message-modal-button cancel" onClick={onClose}>
              취소
            </button>
            <button
              className="message-modal-button confirm"
              onClick={handleConfirm}
              disabled={!message.trim()}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
