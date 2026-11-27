import React from "react";
import styles from "./Modal.module.css";

// Petite modale de confirmation affichée après la suppression des réponses
const DeleteResponsesSuccessModal = ({ isOpen, title, message, onClose }) => {
  // Si la modale n'est pas ouverte, on n'affiche rien du tout
  if (!isOpen) return null;

  return (
    // Fond sombre qui recouvre toute la page
    <div className={styles.modalOverlay}>
      {/* Boîte blanche au centre avec le contenu */}
      <div className={styles.modalContent}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.modalActions}>
          {/* Ferme la modale au clic (le parent gère le changement de isOpen) */}
          <button onClick={onClose} className={styles.closeButton}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteResponsesSuccessModal;