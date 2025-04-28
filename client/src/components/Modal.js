import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Modal.module.css";

const Modal = ({ isOpen, title, message, onClose, onConfirm, redirectPath }) => {
  const navigate = useNavigate();

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
                onConfirm();
                if (redirectPath) navigate(redirectPath);
                onClose();
              }}
              className={styles.confirmButton}
            >
              Confirmer
            </button>
          )}
          <button onClick={onClose} className={styles.closeButton}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
