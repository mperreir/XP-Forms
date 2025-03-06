import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const FormResponsesList = () => {
  const { id } = useParams(); // ID du formulaire
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${id}/responses`);
        if (!response.ok) throw new Error("Erreur lors du chargement des réponses");
        const data = await response.json();
        setResponses(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchResponses();
  }, [id]);

  return (
    <div>
      <h2>Réponses au formulaire</h2>
      <table border="1">
        <thead>
          <tr>
            <th>#</th>
            <th>Participant</th>
            <th>Réponses</th>
          </tr>
        </thead>
        <tbody>
          {responses.length > 0 ? (
            responses.map((response, index) => (
              <tr key={response.response_id}>
                <td>{index + 1}</td>
                <td>{response.user_id}</td>
                <td>
                  {Object.entries(response.responses).map(([key, value]) => (
                    <p key={key}>
                      <strong>{key}:</strong> {Array.isArray(value) ? value.join(", ") : value}
                    </p>
                  ))}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">Aucune réponse trouvée</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FormResponsesList;
