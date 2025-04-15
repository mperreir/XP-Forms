import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Form } from "@bpmn-io/form-js-viewer";
import styles from './form_viewer.module.css'; // Import the CSS Module

const FormViewer = () => {
  const { id, id_participant } = useParams(); // Récupération des paramètres de l'URL
  const containerRef = useRef(null);
  const [schema, setSchema] = useState(null);
  const [formDetails, setFormDetails] = useState(null);
  const [componentMapping, setComponentMapping] = useState({}); // Mapping key → id
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchFormSchema = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${id}`);
        if (!response.ok) throw new Error("Erreur lors du chargement du formulaire");
        const data = await response.json();
  
        if (!data || !data.json_data || !Array.isArray(data.json_data.components)) {
          throw new Error("Le schéma du formulaire est invalide ou vide.");
        }
  
        setSchema(data.json_data); // Charger le schéma du formulaire
        setFormDetails(data); // Stocker toutes les infos du formulaire
  
        // Construire le mapping entre key et id
        const mapping = {};
        data.json_data.components.forEach((component) => {
          mapping[component.key] = component.id;
        });
        setComponentMapping(mapping);
  
      } catch (error) {
        console.error("Erreur lors du chargement du schéma du formulaire:", error);
        alert("Erreur lors du chargement du formulaire");
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
      if (typeof id_participant !== 'undefined') {
        const rawData = event.data;
        console.log("Raw Data:", rawData);

        // Transformer le JSON pour utiliser component_id au lieu de key
        const transformedData = Object.entries(rawData).map(([key, value]) => ({
          component_id: componentMapping[key],
          value: value
        }));

        console.log("Transformed Data:", transformedData);

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

    // Auto-save lors des modifications
    form.on("changed", (event) => {
      if (!id_participant) return;

      const newData = event.data; // Contient toutes les réponses actuelles

      // Trouver quel champ a changé
      Object.entries(newData).forEach(([key, value]) => {
        if (formData[key] !== value) {
          setFormData((prevData) => ({
            ...prevData,
            [key]: value,
          }));

          const component_id = componentMapping[key]; // Récupérer l'id du composant
          if (!component_id) return; // Sécurité si key non mappé

          console.log(`Envoi auto-save: component_id=${component_id}, value=${value}`);

          fetch("http://localhost:5000/api/save-response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              form_id: id,
              user_id: id_participant,
              component_id,
              value,
            }),
          })
          .then((response) => response.json())
          .then((data) => {
            console.log("Réponse sauvegardée :", data);
          })
          .catch((error) => {
            console.error("Erreur lors de la sauvegarde :", error);
          });
        }
      });
    });

    return () => {
      form.destroy();
    };
  }, [schema, componentMapping]);

  return (
    <div className={styles.formViewerContainer}>
      <h2>Form Viewer</h2>

      {!id_participant && formDetails && (
        <div className={styles.formDetails}>
          <p><strong>ID du Formulaire :</strong> {formDetails.id}</p>
          <p><strong>Date de Création :</strong> {new Date(formDetails.created_at).toLocaleString()}</p>
          <p><strong>URL :</strong> http://localhost:3000/form-viewer/{id}/id_participant </p>
        </div>
      )}

      {id_participant && (
        <div>
          <p><strong>ID du Participant :</strong> {id_participant}</p>
        </div>
      )}

      {schema ? (
        <div ref={containerRef} id="form" style={{ width: "100%" }}></div>
      ) : (
        <p>Chargement du formulaire...</p>
      )}
    </div>
  );
};

export default FormViewer;
