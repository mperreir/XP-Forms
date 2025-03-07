import React, { useEffect, useRef, useState } from "react"; 
import { useParams } from "react-router-dom";
import { Form } from "@bpmn-io/form-js-viewer";
import './form_viewer.css';

const FormViewer = () => {
  const { id, id_participant } = useParams(); // Récupération des paramètres de l'URL
  const containerRef = useRef(null);
  const [schema, setSchema] = useState(null);
  const [formDetails, setFormDetails] = useState(null);
  const [componentMapping, setComponentMapping] = useState({}); // Mapping key → id

  useEffect(() => {
    const fetchFormSchema = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${id}`);
        if (!response.ok) throw new Error("Erreur lors du chargement du formulaire");
        const data = await response.json();
        
        setSchema(data.json_data); // Charger le schéma du formulaire
        setFormDetails(data); // Stocker toutes les infos du formulaire

        // Construire le mapping entre key et id
        const mapping = {};
        data.json_data.components.forEach((component) => {
          mapping[component.key] = component.id;
        });
        setComponentMapping(mapping);

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

    // Écoute de l'événement submit
    form.on("submit", (event) => {
      /* Si l'utilisateur est un participant les reponses seront enregistrées si c'est un experimentateur les reponses ne seront pas enregistrées */
      if(typeof id_participant !== 'undefined'){
        const rawData = event.data;
        console.log("Raw Data:", rawData);

        // Transformer le JSON pour utiliser component_id au lieu de key
        const transformedData = Object.entries(rawData).map(([key, value]) => ({
          component_id: componentMapping[key], // Récupération de l'id
          value: value
        }));

        console.log("Transformed Data:", transformedData);

        // Envoyer au backend
        fetch("http://localhost:5000/api/submit-form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            form_id: id,
            user_id: id_participant,
            responses: transformedData
          })
        })
        .then((response) => response.json())
        .then((data) => {
          console.log("Réponse du serveur:", data);
          alert("Formulaire soumis avec succès !");
        })
        .catch((error) => {
          console.error("Erreur lors de la soumission:", error);
          alert("Une erreur est survenue !");
        });
      }
    });

    return () => {
      form.destroy();
    };
  }, [schema, componentMapping]);

  return (
    <div>
      <h2>Form Viewer</h2>

      {/* Afficher les détails du formulaire seulement si id_participant est absent de l'url (donc experimentateur) */}
      {!id_participant && formDetails && (
        <div>
          <p><strong>ID du Formulaire :</strong> {formDetails.id}</p>
          <p><strong>Date de Création :</strong> {new Date(formDetails.created_at).toLocaleString()}</p>
          <p><strong>URL :</strong> http://localhost:3000/form-viewer/{id}/id_participant </p>
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
    </div>
  );
};

export default FormViewer;
