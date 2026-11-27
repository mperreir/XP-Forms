import React, { useState, useCallback } from "react";
import styles from "./ImportModal.module.css"

// Modale d'import : l'utilisateur dépose (ou choisit) un zip contenant des formulaires JSON
const ImportModal = ({ isOpen, onConfirm, onClose, onFormatError, onError }) => {

  // Met la zone de dépôt en surbrillance quand un fichier la survole
  const [highlight, setHighlight] = useState(false);
  // Affiche ou cache la fenêtre avec le détail des erreurs
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  // Liste des fichiers qui ont posé problème lors du dernier import
  const [importErrors, setImportErrors] = useState([]);
  // Petit bilan du dernier import (réussis / tentés)
  const [lastImportStats, setLastImportStats] = useState(null);

  // Envoie un formulaire à l'API, puis importe aussi ses réponses s'il y en a
  const handleImportForm = async (result, fileName = "") => {
    const response = await fetch(`/api/import-form`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result)
    });
    const json = await response.json();

    // Si l'API refuse le fichier, on lance une erreur "formatError"
    // qu'on rattrape plus loin pour la ranger dans la bonne catégorie
    if (!response.ok) {
      const error = new Error("formatError");
      error.fileName = fileName;
      throw error;
    }
    // On importe les réponses utilisateur, une par une
    if (result.responses != {}) {
      try {
        for (const user in result.responses) {
          // Chaque réponse doit pointer vers l'id du formulaire tout juste créé
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
        // On ne bloque pas l'import du formulaire si les réponses échouent, on log juste
        console.log("Echec de l'importation des réponses. : ", e);
      }
    }
  };

  // Quand un fichier passe au-dessus de la zone : on empêche le comportement
  // par défaut du navigateur (qui ouvrirait le fichier) et on allume la zone
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setHighlight(true);
  }, []);

  // Le fichier quitte la zone : on éteint la surbrillance
  const onDragLeave = useCallback(() => {
    setHighlight(false);
  }, []);

  // Parcourt récursivement un dossier déposé et importe chaque fichier JSON trouvé
  // (version "dossier", pas utilisée pour l'instant puisqu'on passe par le zip)
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
        // C'est un dossier : on lit son contenu et on rappelle la fonction sur chaque entrée
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

  // Ouvre le zip, importe chaque fichier JSON et renvoie un bilan
  // (fichiers au mauvais format, autres erreurs, nombre de succès)
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
          // On saute les dossiers, seuls les fichiers nous intéressent
          if (file.dir) continue;

          try {
            const content = await file.async("text");
            const formJson = JSON.parse(content);
            await handleImportForm(formJson, fileName);
            successCount++;
          } catch (err) {
            // On trie les erreurs selon leur origine pour afficher un message clair
            if (err.message === "formatError") {
              // L'API a refusé la structure du JSON
              formatErrorFiles.push({
                fileName: err.fileName || fileName,
                reason: "Format de fichier invalide (structure JSON non reconnue par l'API)"
              });
            } else if (err instanceof SyntaxError) {
              // Le fichier n'est même pas du JSON valide
              genericErrorFiles.push({
                fileName,
                reason: "Fichier JSON malformé (syntaxe invalide)"
              });
            } else {
              // Tout le reste (réseau, etc.)
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

  // Au dépôt : on glisse le fichier dans l'input caché pour réutiliser
  // la même logique que le choix manuel, puis on met l'aperçu à jour
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setHighlight(true);
    const input = document.querySelector("#fileSelector");
    input.files = e.dataTransfer.files;
    updateInput();
  }, []);

  // Le label sert de faux bouton : il déclenche le clic sur l'input caché
  const onClickLabel = () => {
    const input = document.querySelector("#fileSelector");
    input.click();
  }

  // Affiche le nom du fichier choisi dans l'aperçu
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

  // Lance l'import quand on clique sur "Importer"
  const submit = useCallback(async () => {
    try {
      const input = document.querySelector("#fileSelector");
      let promises = [];
      let items = input.files[0];
      // On n'accepte que les zip
      if (items && items.name.endsWith(".zip")) {
        promises.push(handleZipFolder(items));
      }

      const results = await Promise.allSettled(promises);

      // On rassemble les erreurs de format de tous les imports réussis
      const allFormatErrors = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value?.formatErrorFiles ?? []);

      // Pareil pour les erreurs génériques
      const allGenericErrors = results
        .filter(r => r.status === "fulfilled")
        .flatMap(r => r.value?.genericErrorFiles ?? []);

      // Liste unique d'erreurs, avec un libellé de type pour le tableau de détails
      const allErrors = [
        ...allFormatErrors.map(e => ({ ...e, type: "Format invalide" })),
        ...allGenericErrors.map(e => ({ ...e, type: "Erreur d'importation" })),
      ];

      // Nombre total de formulaires importés correctement
      const successCount = results
        .filter(r => r.status === "fulfilled")
        .reduce((acc, r) => acc + (r.value?.successCount ?? 0), 0);

      const totalAttempted = successCount + allErrors.length;

      setImportErrors(allErrors);
      setLastImportStats({ successCount, totalAttempted });

      // On prévient le parent pour chaque fichier au mauvais format
      // (on garde juste le nom du fichier, sans le dossier ni l'extension)
      if (allFormatErrors.length > 0) {
        allFormatErrors.forEach(({ fileName }) => {
          if (onFormatError) onFormatError(fileName.split("/")[1]?.split(".")[0] ?? fileName);
        });
      }

      // Astuce : on "clique" sur des divs invisibles pour déclencher les callbacks du parent
      if (successCount > 0) {
        // Au moins un formulaire importé : succès
        document.querySelector("#importSuccess").click();
      } else if (allErrors.length === 0) {
        // Rien importé et aucune erreur : il n'y avait sans doute rien à importer
        document.querySelector("#error").click();
      }

    } catch (err) {
      // Problème inattendu : on signale l'erreur au parent
      document.querySelector("#error").click();
    }
  });

  // Modale fermée : on n'affiche rien
  if (!isOpen) return null;

  return (
    <div className={styles.ImportModalOverlay}>
      <div className={styles.ImportModalContent}>
        <h2>Importer</h2>

        {/* Zone de glisser-déposer */}
        <div
          className={`${styles.dropZone} ${highlight ? styles.highlight : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          Glissez un fichier zip ici.
        </div>

        <div>
          {/* Alternative au glisser-déposer : choisir le fichier à la main */}
          <label className={styles.fileLabel} id="fileLabel" onClick={onClickLabel}>
            Choisissez un fichier zip à importer
          </label>
          {/* Input caché, piloté par le label et la zone de dépôt */}
          <input
            className={styles.fileSelector}
            type='file'
            accept=".zip"
            id="fileSelector"
            onChange={updateInput}
          />
        </div>

        {/* Aperçu du fichier sélectionné */}
        <div className={styles.preview} id="filePreview">
          <p>Pas de fichier selectionné</p>
        </div>

        {/* Bouton qui n'apparaît que s'il y a eu des erreurs */}
        {importErrors.length > 0 && (
          <button
            className={styles.errorDetailsButton}
            onClick={() => setShowErrorDetails(true)}
          >
            Voir les détails des erreurs ({importErrors.length} fichier{importErrors.length > 1 ? "s" : ""})
          </button>
        )}

        {/* Déclencheurs invisibles utilisés par submit() pour appeler les callbacks du parent */}
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
              Annuler
            </button>
          )}
          <button className={styles.fileSubmitButton} onClick={submit}>
            Importer
          </button>
        </div>
      </div>

      {/* Fenêtre par-dessus la modale avec le détail des erreurs */}
      {showErrorDetails && (
        <div className={styles.errorDetailsOverlay}>
          <div className={styles.errorDetailsModal}>
            <h3>Détails des erreurs d'importation</h3>

            {/* Résumé : combien de formulaires ont été importés sur combien tentés */}
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
                      {/* On n'affiche que le nom du fichier, pas son chemin dans le zip */}
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
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportModal;