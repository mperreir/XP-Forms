import React from "react";
import { useTranslation } from 'react-i18next';
import styles from "./Modal.module.css";

// Modale générique et réutilisable : titre, message et boutons Fermer / Confirmer au choix
const Modal = ({ isOpen, title, message, onConfirm, confirm, close, onClose }) => {
  // Fonction de traduction (react-i18next) pour le texte des boutons
  const { t } = useTranslation();
  // Si la modale n'est pas ouverte, on n'affiche rien
  if (!isOpen) return null;

  return (
    // Fond sombre qui recouvre toute la page
    <div className={styles.modalOverlay}>
      {/* Boîte au centre avec le contenu */}
      <div className={styles.modalContent}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className={styles.modalActions}>
          {/* Le bouton Fermer n'apparaît que si le parent fournit un onClose */}
          {onClose && (
            <button
              onClick={onClose}
              className={styles.closeButton}
            >
              {/* Texte personnalisé si "close" est passé, sinon "Close" par défaut (traduit) */}
              {close ? t(close) : t('Close')}
            </button>
          )}
          {/* Pareil pour Confirmer : seulement si onConfirm est fourni */}
          {onConfirm && (
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
              }}
              className={styles.confirmButton}
            >
              {/* Texte personnalisé si "confirm" est passé, sinon "Confirm" par défaut (traduit) */}
              {confirm ? t(confirm) : t('Confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;