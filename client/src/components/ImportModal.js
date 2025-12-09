import React, { useState, useCallback } from "react";
import styles from "./ImportModal.module.css"

const ImportModal = ({ isOpen, onConfirm, onClose, onFormatError, onError }) => {

  const [highlight, setHighlight] = useState(false);

  const handleImportForm = async (result) => {
    try {

      const response = await fetch(`/api/import-form`, { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });

      if (response.ok) {

        document.querySelector("#importSuccess").click();

      } else {
        document.querySelector("#formatError").click();

      }
    } catch (error) {
      console.error("Erreur :", error);
      document.querySelector("#error").click();
    }
  };

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setHighlight(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setHighlight(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setHighlight(true);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const formJson = JSON.parse(reader.result);
        handleImportForm(formJson);
      }
      catch (err) {
        document.querySelector("#formatError").click();
      }
    };
    reader.readAsText(file);

  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.ImportModalOverlay}>
      <div className={styles.ImportModalContent}>
        <h2>Importer</h2>
        <div className={`${styles.dropZone} ${highlight ? styles.highlight : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          Glissez un fichier ici.
        </div>
        {onConfirm && (
          <div className={styles.closeImportModal}
            id="importSuccess"
            onClick={() => {
              if (onConfirm) onConfirm();
            }}></div>
        )}
        {onFormatError && (
          <div className={styles.closeImportModal}
            id="formatError"
            onClick={() => {
              if (onFormatError) onFormatError();
            }}></div>
        )}
        {onError && (
          <div className={styles.closeImportModal}
            id="error"
            onClick={() => {
              if (onError) onError();
            }}></div>
        )}
        {onClose && (
          <button
            onClick={onClose} // Call the onClose callback
            className={styles.closeButton}
          >
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}

export default ImportModal;