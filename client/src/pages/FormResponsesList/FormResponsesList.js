import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const FormResponsesList = () => {
  const { id } = useParams(); // Récupération de l'ID du formulaire
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${id}/responses`);
        if (!response.ok) throw new Error("Erreur lors du chargement des réponses");

        const data = await response.json();
        console.log("📩 Réponses reçues :", data); // Debugging
        setResponses(data);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des réponses :", error);
      }
    };

    fetchResponses();
  }, [id]);

  return (
    <div>
      <h2>Réponses du formulaire</h2>
      {responses.length > 0 ? (
        <table border="1">
          <thead>
            <tr>
              <th>ID Utilisateur</th>
              <th>Questions & Réponses</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((userResponse, index) => (
              <tr key={index}>
                <td>{userResponse.user_id}</td>
                <td>
                  <ul>
                    {userResponse.responses.map((resp, i) => (
                      <li key={i}><strong>{resp.question}:</strong> {resp.answer}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucune réponse trouvée.</p>
      )}
    </div>
  );
};

export default FormResponsesList;
