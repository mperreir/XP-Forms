import React from "react";
import styles from "./Modal.module.css";

const Modal = ({ isOpen, title, message, onConfirm, confirm = 'Confirmer', close = 'Fermer', onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.modalActions}>
          {onConfirm && (
            <button
              onClick={() => {
                if (onConfirm) onConfirm(); // Call the onConfirm callback
              }}
              className={styles.confirmButton}
            >
              {confirm}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose} // Call the onClose callback
              className={styles.closeButton}
            >
              {close}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
