import React, { useState, useCallback } from "react";
import styles from "./ImportModal.module.css"

const ImportModal = ({ isOpen, onConfirm, onClose, onFormatError, onError }) => {

  const [highlight, setHighlight] = useState(false);

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

  const handleZipFolder = (zipFolder) => {
    return new Promise(async (resolve) => {
      const JSZip = require("jszip");
      const zipReader = new FileReader();

      zipReader.onload = async () => {
        const zip = await JSZip.loadAsync(zipReader.result);
        const formatErrorFileNames = [];
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
              formatErrorFileNames.push(err.fileName || fileName);
            } else {
              console.error("Erreur fichier:", fileName, err);
            }
          }
        }

        resolve({ formatErrorFileNames, successCount });
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

    // try {
    //   let promises = [];
    //   let items = e.dataTransfer.files[0];
    //   if (items && items.name.endsWith(".zip")) {
    //     promises.push(handleZipFolder(items));
    //   }
    //   else {
    //     items = e.dataTransfer.items;

    //     for (let i = 0; i < items.length; i++) {
    //       const item = items[i].webkitGetAsEntry();
    //       if (item) {
    //         promises.push(traverseFileTree(item));
    //       }
    //     }
    //   }

    //   const results = await Promise.allSettled(promises);

    //   const hasSuccess = results.some(r => r.status === "fulfilled");

    //   if (hasSuccess) {
    //     document.querySelector("#importSuccess").click();
    //   } else {
    //     document.querySelector("#error").click();
    //   }

    // } catch (err) {
    //   document.querySelector("#error").click();
    // }
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
    }
    else {
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

      const formatErrorFiles = results
        .filter(r => r.status === "fulfilled" && r.value?.formatErrorFileNames?.length > 0)
        .flatMap(r => r.value.formatErrorFileNames);

      const hasSuccess = results.some(r => r.status === "fulfilled" && r.value?.successCount > 0);

      if (formatErrorFiles.length > 0) {
        formatErrorFiles.forEach(fileName => {
          if (onFormatError) onFormatError(fileName.split("/")[1]);
        });
      }

      if (hasSuccess) {
        document.querySelector("#importSuccess").click();
      } else if (formatErrorFiles.length === 0) {
        document.querySelector("#error").click();
      }

    } catch (err) {
      document.querySelector("#error").click();
    }
  })

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
        <div>
          <label className={styles.fileLabel} id="fileLabel"
            onClick={onClickLabel}
          >Choisissez un dossier à importer</label>
          <input className={styles.fileSelector} type='file' accept=".zip" id="fileSelector"
            onChange={updateInput}
          ></input>
        </div>
        <div className={styles.preview} id="filePreview">
          <p>Pas de dossier selectionné</p>
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
        <div className={styles.buttonsLine}>
          {onClose && (
            <button
              onClick={onClose}
              className={styles.closeButton}
            >
              Fermer
            </button>
          )}
          <button className={styles.fileSubmitButton}
            onClick={submit}>
            Importer
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;