import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import styles from "./FormResponsesList.module.css";

import { useTranslation } from "react-i18next";

const FormResponsesList = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [formTitle, setFormTitle] = useState("");
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ message: "", type: "" });

  const handleGoHome = () => {
    navigate("/");
  };

  const showModal = (title, message, onConfirm = null, onClose = null) => {
    setModal({ isOpen: true, title, message, onConfirm, onClose });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "", onConfirm: null, onClose: null });
  };

  const showNotification = (message, type = "success", duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
        setNotification({ message: "", type: "" });
    }, duration);
  };
  
  useEffect(() => {
    const fetchFormInfo = async () => {
      try {
        const response = await fetch(`/api/forms/${id}`);
        if (!response.ok) throw new Error(t("Error loading form"));

        const form = await response.json();
        setFormTitle(form.title || t("Untitled form"));

      } catch (error) {
        console.error("Erreur chargement formulaire :", error);
      }
    };
    fetchFormInfo();
  }, [id]);

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
        console.error("Erreur lors du chargement des réponses :", error);
      }
    };

    fetchResponses();
  }, [id]);

  const exportToCSV = () => {
    const headers = [t("User ID"), ...questions];
    const rows = responses.map((userResponse) => {
      const row = [userResponse.user_id];
      questions.forEach((question) => {
        const answerObj = userResponse.responses.find((resp) => resp.question === question);
        row.push(answerObj ? answerObj.answer || "N/A" : "N/A");
      });
      return row;
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const title = formTitle.replace(/[^a-z0-9_-]/gi, "_");
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            setResponses([]);
          } else {
            const errorData = await response.json();
            showNotification(t("Error: ") + errorData.error, "error");
          }
        } catch (error) {
          console.error(t("Error deleting responses:"), error);
          showNotification(t("Unable to contact the server."), "error");
        }
      },
      closeModal
    );
  };

  return (
    <div className={styles.container}>
      <h2>{t('Form responses')}</h2>

      <button className="btn" onClick={handleGoHome}>{t('Back to home')}</button>
      <button onClick={exportToCSV} style={{ marginBottom: "10px" }}>{t('Export to CSV')}</button>

      {responses.length > 0 && questions.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>{t('User ID')}</th>
                {questions.map((question, index) => (
                  <th key={index}>{question}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((userResponse, index) => (
                <tr key={index}>
                  <td>{userResponse.user_id}</td>
                  {questions.map((question, qIndex) => {
                    const answerObj = userResponse.responses.find((resp) => resp.question === question);
                    return <td key={qIndex}>{answerObj ? answerObj.answer || "N/A" : "N/A"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.message}>{t('Loading data or no responses found.')}</p>
      )}

      <button
        onClick={handleDeleteResponses}
        style={{ backgroundColor: "#dc3545", color: "white", marginBottom: "10px", marginLeft: "10px" }}
      >
        {t('Delete all responses')}
      </button>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={modal.onClose}
        confirm={t('Confirm')}
        close={t('Close')}
      />

      {notification.message && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.message}
        </div>
      )}
    </div>
  );
};

export default FormResponsesList;
