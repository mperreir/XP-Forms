import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import DeleteResponsesSuccessModal from "../../components/DeleteResponsesSuccessModal";
import styles from "./FormResponsesList.module.css";

const FormResponsesList = () => {
  const { id } = useParams();
  const [formTitle, setFormTitle] = useState("");
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const [successModal, setSuccessModal] = useState({ isOpen: false, title: "", message: "" });
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const showModal = (title, message, onConfirm = null, onClose = null) => {
    setModal({ isOpen: true, title, message, onConfirm, onClose });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "", onConfirm: null, onClose: null });
  };

  const showSuccessModal = (title, message) => {
    setSuccessModal({ isOpen: true, title, message });
  };

  const closeSuccessModal = () => {
    setSuccessModal({ isOpen: false, title: "", message: "" });
  };

  useEffect(() => {
    const fetchFormInfo = async () => {
      try {
        const response = await fetch(`/api/forms/${id}`);
        if (!response.ok) throw new Error("Erreur lors du chargement du formulaire");

        const form = await response.json();
        setFormTitle(form.title || "formulaire");

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
        if (!response.ok) throw new Error("Erreur lors du chargement des réponses");

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
    const headers = ["ID Utilisateur", ...questions];
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
      "Confirmation",
      "Êtes-vous sûr de vouloir supprimer toutes les réponses de ce formulaire ?",
      async () => {
        try {
          const response = await fetch(`/api/forms/${id}/responses`, {
            method: "DELETE",
          });
          if (response.ok) {
            closeModal();
            showSuccessModal("Succès", "Toutes les réponses ont été supprimées.");
            setResponses([]);
          } else {
            const errorData = await response.json();
            showModal("Erreur", "Erreur : " + errorData.error);
          }
        } catch (error) {
          console.error("Erreur lors de la suppression :", error);
          showModal("Erreur", "Impossible de contacter le serveur.");
        }
      },
      closeModal
    );
  };

  return (
    <div className={styles.container}>
      <h2>Réponses du formulaire</h2>

      <button className="btn" onClick={handleGoHome}>Retour à l'accueil</button>
      <button onClick={exportToCSV} style={{ marginBottom: "10px" }}>Exporter en CSV</button>

      {responses.length > 0 && questions.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID Utilisateur</th>
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
      ) : (
        <p className={styles.message}>Chargement des données ou aucune réponse trouvée.</p>
      )}

      <button
        onClick={handleDeleteResponses}
        style={{ backgroundColor: "#dc3545", color: "white", marginBottom: "10px", marginLeft: "10px" }}
      >
        Supprimer toutes les réponses
      </button>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={modal.onClose}
      />

      <DeleteResponsesSuccessModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
        onClose={closeSuccessModal}
      />
    </div>
  );
};

export default FormResponsesList;
