import React, { useState, useEffect } from 'react';
import './InputModal.css';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title?: string;
  message?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '입력',
  message,
  placeholder = '',
  confirmText = '확인',
  cancelText = '취소',
  defaultValue = '',
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="input-modal-overlay" onClick={onClose}>
      <div className="input-modal-content" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="input-modal-title">{title}</h2>}
        {message && (
          <div className="input-modal-body">
            <p>{message}</p>
          </div>
        )}
        <input
          type="text"
          className="input-modal-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          autoFocus
        />
        <div className="input-modal-buttons">
          <button className="input-modal-button cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button
            className="input-modal-button confirm"
            onClick={handleConfirm}
            disabled={!inputValue.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
