import React from "react";
import styles from "./Modal.module.css";

const Modal = ({ isOpen, title, message, onConfirm, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.modalActions}>
          {onClose && (
            <button
              onClick={onClose} // Call the onClose callback
              className={styles.closeButton}
            >
              Fermer
            </button>
          )}
          {onConfirm && (
            <button
              onClick={() => {
                if (onConfirm) onConfirm(); // Call the onConfirm callback
              }}
              className={styles.confirmButton}
            >
              Confirmer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
