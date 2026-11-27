import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import styles from "./FormResponsesList.module.css";
import { useTranslation } from 'react-i18next';

// Page qui affiche les réponses d'un formulaire dans un tableau (une ligne par participant,
// une colonne par question), avec export en CSV et suppression de toutes les réponses
const FormResponsesList = () => {
  const { id } = useParams(); // id du formulaire, pris dans l'URL (/form-responses/:id)
  const [formTitle, setFormTitle] = useState(""); // sert à nommer le fichier CSV
  const [responses, setResponses] = useState([]); // réponses regroupées par participant
  const [questions, setQuestions] = useState([]); // liste des questions = colonnes du tableau
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ message: "", type: "" });
  const { t } = useTranslation();

  // Retour à la page d'accueil
  const handleGoHome = () => {
    navigate("/");
  };

  // Ouvre la modale de confirmation
  const showModal = (title, message, onConfirm = null, onClose = null) => {
    setModal({ isOpen: true, title, message, onConfirm, onClose });
  };

  // Ferme la modale et remet tout à zéro
  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "", onConfirm: null, onClose: null });
  };

  // Notification temporaire qui disparaît après "duration" ms
  const showNotification = (message, type = "success", duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
        setNotification({ message: "", type: "" });
    }, duration);
  };
  
  // Charge le titre du formulaire (utilisé pour le nom du fichier CSV)
  useEffect(() => {
    const fetchFormInfo = async () => {
      try {
          const response = await fetch(`/api/forms/${id}`);
          if (!response.ok) throw new Error(t("Error loading form"));

        const form = await response.json();
        setFormTitle(form.title || t("form"));

      } catch (error) {
        console.error("Erreur chargement formulaire :", error);
      }
    };
    fetchFormInfo();
  }, [id]);

  // Charge les réponses, puis en déduit la liste des questions (sans doublons) pour les colonnes
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await fetch(`/api/forms/${id}/responses`);
        if (!response.ok) throw new Error(t("Error loading responses"));

        const data = await response.json();
        const extractedQuestions = [];

        data.forEach((userResponse) => {
          userResponse.responses.forEach((resp) => {
            if (!extractedQuestions.includes(resp.question)) {
              extractedQuestions.push(resp.question);
            }
          });
        });

        setQuestions(extractedQuestions);
        setResponses(data);
      } catch (error) {
        console.error(t("Error loading responses"), error);
      }
    };

    fetchResponses();
  }, [id]);

  // Télécharge les réponses au format CSV
  const exportToCSV = () => {
    // Ligne d'en-tête : ID utilisateur puis une colonne par question
    const headers = [t("User ID"), ...questions];
    // Une ligne par participant ("N/A" quand il n'a pas répondu à une question)
    const rows = responses.map((userResponse) => {
      const row = [userResponse.user_id];
      questions.forEach((question) => {
        const answerObj = userResponse.responses.find((resp) => resp.question === question);
        row.push(answerObj ? answerObj.answer || t("N/A") : t("N/A"));
      });
      return row;
    });

    // Chaque cellule est entourée de guillemets, séparées par des virgules
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Astuce classique pour télécharger : on crée un lien invisible, on clique dessus, on le retire
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    // Titre nettoyé : les caractères spéciaux sont remplacés par "_"
    const title = formTitle.replace(/[^a-z0-9_-]/gi, "_");
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Supprime toutes les réponses du formulaire, après confirmation
  const handleDeleteResponses = () => {
    showModal(
      t("Confirmation"),
      t("Are you sure you want to delete all responses for this form?"),
      async () => {
        try {
          const response = await fetch(`/api/forms/${id}/responses`, {
            method: "DELETE",
          });
          if (response.ok) {
            closeModal();
            showNotification(t("All responses have been deleted."), "success");
            // On vide le tableau affiché
            setResponses([]);
          } else {
            const errorData = await response.json();
            showNotification(t("Error: ") + errorData.error, "error");
          }
        } catch (error) {
          console.error("Erreur lors de la suppression :", error);
          showNotification(t("Unable to contact server."), "error");
        }
      },
      closeModal
    );
  };

  return (
    <div className={styles.container}>
      {/* Barre du haut : retour, export, titre, suppression */}
      <div className={styles.toolbar}>
        <div className={styles.left}>
          <button className={styles.btnAccueil} onClick={handleGoHome}>
            {t("Back to home")}
          </button>
          <button onClick={exportToCSV}>{t("Export to CSV")}</button>
        </div>
        <h2 className={styles.title}>{t("Form responses")}</h2>
        <div className={styles.right}>
          <button
            onClick={handleDeleteResponses}
            className={styles.deleteBtn}
          >
            {t("Delete all responses")}
          </button>
        </div>
      </div>
      {/* Tableau des réponses, ou message s'il n'y a rien à afficher */}
      {responses.length > 0 && questions.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>{t("User ID")}</th>
                {questions.map((question, index) => (
                  <th key={index}>{question}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((userResponse, index) => (
                <tr key={index}>
                  <td>{userResponse.user_id}</td>
                  {/* Une cellule par question : la réponse du participant, ou "N/A" */}
                  {questions.map((question, qIndex) => {
                    const answerObj = userResponse.responses.find((resp) => resp.question === question);
                    return <td key={qIndex}>{answerObj ? answerObj.answer || t("N/A") : t("N/A")}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.message}>{t("Loading data or no responses found.")}</p>
      )}

      {/* Modale de confirmation de suppression */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={modal.onClose}
      />

      {/* Notification de succès / erreur */}
      {notification.message && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.message}
        </div>
      )}
    </div>
  );
};

export default FormResponsesList;