import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Modal.module.css";

const Modal = ({ isOpen, title, message, onConfirm }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.modalActions}>
          <button
            onClick={() => {
              if (onConfirm) onConfirm(); // Call the onConfirm callback
            }}
            className={styles.confirmButton}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
