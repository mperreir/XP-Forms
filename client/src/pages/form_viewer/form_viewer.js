import React, { useEffect, useRef, useState } from "react"; 
import { useParams } from "react-router-dom";
import { Form } from "@bpmn-io/form-js-viewer";
import './form_viewer.css';

const FormViewer = () => {
  const { id, id_participant } = useParams(); // Récupération des paramètres de l'URL
  const containerRef = useRef(null);
  const [schema, setSchema] = useState(null);
  const [formDetails, setFormDetails] = useState(null);
  const [formInstance, setFormInstance] = useState(null);

  useEffect(() => {
    const fetchFormSchema = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${id}`);
        if (!response.ok) throw new Error("Erreur lors du chargement du formulaire");
        const data = await response.json();
        
        setSchema(data.json_data); // Charger uniquement le schéma du formulaire
        setFormDetails(data); // Stocker toutes les infos du formulaire
      } catch (error) {
        console.error(error);
      }
    };

    fetchFormSchema();
  }, [id]);

  useEffect(() => {
    if (!schema) return;

    const form = new Form({
      container: containerRef.current,
    });

    form
      .importSchema(schema)
      .then(() => {
        console.log("Form imported successfully!");
      })
      .catch((error) => {
        console.error("Error importing form schema:", error);
      });

    form.on("submit", async (event) => {
      console.log("Form <submit>", event);
      const responseData = event.data; // Les réponses soumises par le participant

      try {
        const response = await fetch("http://localhost:5000/api/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            form_id: id,
            user_id: id_participant,
            responses: responseData,
          }),
        });

        if (!response.ok) throw new Error("Erreur lors de l'enregistrement des réponses");
        
        alert("Réponses enregistrées avec succès !");
      } catch (error) {
        console.error("Erreur :", error);
      }
    });

    setFormInstance(form);

    return () => {
      form.destroy();
    };
  }, [schema]);

  return (
    <div>
      <h2>Form Viewer</h2>

      {/* Afficher les détails du formulaire seulement si id_participant est absent */}
      {!id_participant && formDetails && (
        <div>
          <p><strong>ID du Formulaire :</strong> {formDetails.id}</p>
          <p><strong>Date de Création :</strong> {new Date(formDetails.created_at).toLocaleString()}</p>
          <p><strong>URL :</strong> http://localhost:3000/form-viewer/{id}/id_participant</p>
        </div>
      )}

      {/* Affichage de l'ID du participant */}
      {id_participant && (
        <div>
          <p><strong>ID du Participant :</strong> {id_participant}</p>
        </div>
      )}

      {/* Affichage du formulaire */}
      {schema ? (
        <div ref={containerRef} id="form" style={{ width: "100%" }}></div>
      ) : (
        <p>Chargement du formulaire...</p>
      )}

      {/* Bouton de soumission affiché uniquement si un participant remplit le formulaire */}
      {/*id_participant && (
        <div id="submit">
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => formInstance && formInstance.submit()}
          >
            Soumettre
          </button>
        </div>
      )*/}
    </div>
  );
};

export default FormViewer;
