import React from "react";
import { useTranslation } from 'react-i18next';
import styles from "./Modal.module.css";

const Modal = ({ isOpen, title, message, onConfirm, confirm, close, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.modalActions}>
          {onClose && (
            <button
              onClick={onClose}
              className={styles.closeButton}
            >
              {close ? t(close) : t('Close')}
            </button>
          )}
          {onConfirm && (
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
              }}
              className={styles.confirmButton}
            >
              {confirm ? t(confirm) : t('Confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
