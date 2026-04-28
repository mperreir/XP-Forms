import React, { useState, useCallback } from "react";
import styles from "./ImportModal.module.css"

const ImportModal = ({ isOpen, onConfirm, onClose, onFormatError, onError }) => {

  const [highlight, setHighlight] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [lastImportStats, setLastImportStats] = useState(null);

  const handleImportForm = async (result, fileName = "") => {
    const response = await fetch(`/api/import-form`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });
    const json = await response.json();

    if (!response.ok) {
      const error = new Error("formatError");
      error.fileName = fileName;
      throw error;
    }
    if (result.responses != {}) {
      try {
        for (const user in result.responses) {
          result.responses[user].forEach(element => {
            element.form_id = json.newFormID;
          });
          await fetch(`/api/submit-form`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 'form_id': json.newFormID, 'user_id': user, 'responses': result.responses[user] })
          });
        }
      }
      catch (e) {
        console.log("Echec de l'importation des réponses. : ", e);
      }
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
      } else if (item.isDirectory) {
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

  const handleZipFolder = (zipFolder) => {
    return new Promise(async (resolve) => {
      const JSZip = require("jszip");
      const zipReader = new FileReader();

      zipReader.onload = async () => {
        const zip = await JSZip.loadAsync(zipReader.result);
        const formatErrorFiles = [];
        const genericErrorFiles = [];
        let successCount = 0;

        for (const fileName of Object.keys(zip.files)) {
          const file = zip.files[fileName];
          if (file.dir) continue;

          try {
            const content = await file.async("text");
            const formJson = JSON.parse(content);
            await handleImportForm(formJson, fileName);
            successCount++;
          } catch (err) {
            if (err.message === "formatError") {
              formatErrorFiles.push({
                fileName: err.fileName || fileName,
                reason: "Format de fichier invalide (structure JSON non reconnue par l'API)"
              });
            } else if (err instanceof SyntaxError) {
              genericErrorFiles.push({
                fileName,
                reason: "Fichier JSON malformé (syntaxe invalide)"
              });
            } else {
              genericErrorFiles.push({
                fileName,
                reason: err.message || "Erreur inconnue"
              });
            }
          }
        }

        resolve({ formatErrorFiles, genericErrorFiles, successCount });
      };

      zipReader.readAsArrayBuffer(zipFolder);
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setHighlight(true);
    const input = document.querySelector("#fileSelector");
    input.files = e.dataTransfer.files;
    updateInput();
  }, []);

  const onClickLabel = () => {
    const input = document.querySelector("#fileSelector");
    input.click();
  }

  const updateInput = () => {
    const input = document.querySelector("#fileSelector");
    const preview = document.querySelector("#filePreview");
    const para = preview.querySelector('p');
    const curFile = input.files[0];
    if (curFile.length === 0) {
      para.textContent = "Pas de dossier selectionné";
    } else {
      para.textContent = curFile.name;
    }
  }

  const submit = useCallback(async () => {
    try {
      const input = document.querySelector("#fileSelector");
      let promises = [];
      let items = input.files[0];
      if (items && items.name.endsWith(".zip")) {
        promises.push(handleZipFolder(items));
      }

      const results = await Promise.allSettled(promises);

      const allFormatErrors = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value?.formatErrorFiles ?? []);

      const allGenericErrors = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value?.genericErrorFiles ?? []);

      const allErrors = [
        ...allFormatErrors.map(e => ({ ...e, type: "Format invalide" })),
        ...allGenericErrors.map(e => ({ ...e, type: "Erreur d'importation" })),
      ];

      const successCount = results
        .filter(r => r.status === "fulfilled")
        .reduce((acc, r) => acc + (r.value?.successCount ?? 0), 0);

      const totalAttempted = successCount + allErrors.length;

      setImportErrors(allErrors);
      setLastImportStats({ successCount, totalAttempted });

      if (allFormatErrors.length > 0) {
        allFormatErrors.forEach(({ fileName }) => {
          if (onFormatError) onFormatError(fileName.split("/")[1]?.split(".")[0] ?? fileName);
        });
      }

      if (successCount > 0) {
        document.querySelector("#importSuccess").click();
      } else if (allErrors.length === 0) {
        document.querySelector("#error").click();
      }

    } catch (err) {
      document.querySelector("#error").click();
    }
  });

  if (!isOpen) return null;

  return (
    <div className={styles.ImportModalOverlay}>
      <div className={styles.ImportModalContent}>
        <h2>Importer</h2>

        <div
          className={`${styles.dropZone} ${highlight ? styles.highlight : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          Glissez un fichier zip ici.
        </div>

        <div>
          <label className={styles.fileLabel} id="fileLabel" onClick={onClickLabel}>
            Choisissez un fichier zip à importer
          </label>
          <input
            className={styles.fileSelector}
            type='file'
            accept=".zip"
            id="fileSelector"
            onChange={updateInput}
          />
        </div>

        <div className={styles.preview} id="filePreview">
          <p>Pas de fichier selectionné</p>
        </div>

        {importErrors.length > 0 && (
          <button
            className={styles.errorDetailsButton}
            onClick={() => setShowErrorDetails(true)}
          >
            Voir les détails des erreurs ({importErrors.length} fichier{importErrors.length > 1 ? "s" : ""})
          </button>
        )}

        {onConfirm && (
          <div className={styles.closeImportModal} id="importSuccess"
            onClick={() => { if (onConfirm) onConfirm(); }} />
        )}
        {onFormatError && (
          <div className={styles.closeImportModal} id="formatError"
            onClick={() => { if (onFormatError) onFormatError(); }} />
        )}
        {onError && (
          <div className={styles.closeImportModal} id="error"
            onClick={() => { if (onError) onError(); }} />
        )}

        <div className={styles.buttonsLine}>
          {onClose && (
            <button onClick={onClose} className={styles.closeButton}>
              Fermer
            </button>
          )}
          <button className={styles.fileSubmitButton} onClick={submit}>
            Importer
          </button>
        </div>
      </div>

      {showErrorDetails && (
        <div className={styles.errorDetailsOverlay}>
          <div className={styles.errorDetailsModal}>
            <h3>Détails des erreurs d'importation</h3>

            {lastImportStats && (
              <p className={styles.importSummary}>
                {lastImportStats.successCount} / {lastImportStats.totalAttempted} formulaire{lastImportStats.totalAttempted > 1 ? "s" : ""} importé{lastImportStats.successCount > 1 ? "s" : ""} avec succès.
              </p>
            )}

            <div className={styles.errorTableWrapper}>
              <table className={styles.errorTable}>
                <thead>
                  <tr>
                    <th>Fichier</th>
                    <th>Type d'erreur</th>
                    <th>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {importErrors.map((err, i) => (
                    <tr key={i}>
                      <td className={styles.errorFileName}>
                        {err.fileName.split("/").pop()}
                      </td>
                      <td className={styles.errorType}>{err.type}</td>
                      <td className={styles.errorReason}>{err.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              className={styles.closeButton}
              onClick={() => setShowErrorDetails(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportModal;