import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./FormResponsesList.module.css";

const FormResponsesList = () => {
  const { id } = useParams(); // Récupération de l'ID du formulaire
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate(); 

  const handleGoHome = () => {
    navigate("/");
  };


  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${id}/responses`);
        if (!response.ok) throw new Error("Erreur lors du chargement des réponses");

        const data = await response.json();
        console.log(" Réponses reçues :", data); // Debugging

        // Extraire les questions uniques
        const extractedQuestions = [];
        data.forEach((userResponse) => {
          userResponse.responses.forEach((resp) => {
            if (!extractedQuestions.includes(resp.question)) {
              extractedQuestions.push(resp.question);
            }
          });
        });

        setQuestions(extractedQuestions); // Stocker les questions uniques
        setResponses(data); // Stocker les réponses
      } catch (error) {
        console.error("Erreur lors du chargement des réponses :", error);
      }
    };

    fetchResponses();
  }, [id]);

 
  const exportToCSV = () => {
    // Build CSV content
    const headers = ["ID Utilisateur", ...questions];
    const rows = responses.map((userResponse) => {
      const row = [userResponse.user_id];
      questions.forEach((question) => {
        const answerObj = userResponse.responses.find((resp) => resp.question === question);
        row.push(answerObj ? answerObj.answer || "N/A" : "N/A");
      });
      return row;
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(",")) // Escape cells with quotes
      .join("\n");

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `form_${id}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      <h2>Réponses du formulaire</h2>
      <button className="btn" onClick={handleGoHome}>
        Retour à l'accueil
      </button>
      <button onClick={exportToCSV} style={{ marginBottom: "10px" }}>
        Exporter en CSV
      </button>
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
    </div>
  );
};

export default FormResponsesList;
