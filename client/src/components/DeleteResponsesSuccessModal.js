import React from "react";
import styles from "./Modal.module.css";

const DeleteResponsesSuccessModal = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.closeButton}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteResponsesSuccessModal;
