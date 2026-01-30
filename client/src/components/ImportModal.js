import React, { useState, useCallback } from "react";
import styles from "./ImportModal.module.css"

const ImportModal = ({ isOpen, onConfirm, onClose, onFormatError, onError }) => {

  const [highlight, setHighlight] = useState(false);

  const handleImportForm = async (result) => {

    const response = await fetch(`/api/import-form`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });

    if (!response.ok) {
      throw new Error("formatError");
    }
  };

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setHighlight(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setHighlight(false);
  }, []);

  const traverseFileTree = (item) => {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const formJson = JSON.parse(reader.result);
              await handleImportForm(formJson);
            } catch (err) {
              console.error("Erreur fichier :", file.name, err);
            }
            resolve();

          };
          reader.readAsText(file);
        });
      }

      else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries(async (entries) => {
          for (const entry of entries) {
            await traverseFileTree(entry);
          }
          resolve();
        });
      }
    });
  };

  const onDrop = useCallback(async (e) => {
    e.preventDefault();
    setHighlight(true);

    try {
      const items = e.dataTransfer.items;
      const promises = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
          promises.push(traverseFileTree(item));
        }
      }

      await Promise.all(promises);
      document.querySelector("#importSuccess").click();

    } catch (err) {
      if (err.message === "formatError") {
        document.querySelector("#formatError").click();
      }
      else {
        document.querySelector("#error").click();
      }
    }
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
          Glissez un fichier/dossier ici.
        </div>
        <input className={styles.fileSelector} type='file' accept=".json" webkitdirectory='true' multiple ></input>
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
            onClick={onClose}
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