import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormEditor } from "@bpmn-io/form-js-editor";
import "./form_editorr.css";
import './form-js-editor.css';

const FormEditor2 = () => {
  const { id } = useParams(); // Récupérer l'ID du formulaire s'il est en modification
  const navigate = useNavigate();
  const editorContainerRef = useRef(null);
  const [formEditor, setFormEditor] = useState(null);
  const [title, setTitle] = useState(""); // Initialize title as empty string
  const [isEditing, setIsEditing] = useState(false); // Mode édition

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const editor = new FormEditor({
      container: editorContainerRef.current,
    });

    setFormEditor(editor);

    if (id) {
      // Charger le formulaire existant pour modification
      fetch(`http://localhost:5000/api/forms/${id}`)
        .then((response) => response.json())
        .then((data) => {
          if (!data.json_data) throw new Error("Le schéma du formulaire est vide !");
          editor.importSchema(data.json_data); // Charger le schéma
          setTitle(data.title || ""); // Set title if exists or keep empty
          setIsEditing(true); // Activer le mode édition
        })
        .catch((err) => console.error("Erreur de chargement :", err));
    } else {
      // Nouveau formulaire (schéma vide par défaut)
      const defaultSchema = { type: "default", components: [] };
      editor.importSchema(defaultSchema);
    }

    return () => {
      editor.destroy();
    };
  }, [id]);

  // Fonction pour enregistrer ou modifier un formulaire
  const handleSaveForm = async () => {
    if (!formEditor) {
      console.warn("L'éditeur n'est pas encore prêt !");
      return;
    }

    const schema = await formEditor.getSchema();
    const formId = id || schema.id || `Form_${Date.now()}`;
    const formTitle = title.trim() || "Formulaire sans titre"; // Use existing title if not provided

    const formData = { id: formId, title: formTitle, json_data: schema };

    try {
      const url = id ? `http://localhost:5000/api/forms/${formId}` : "http://localhost:5000/api/save-form";
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(isEditing ? "Formulaire mis à jour !" : "Formulaire enregistré !");
        navigate("/accueil");
      } else {
        console.error("Erreur serveur :", await response.json());
        alert("Erreur lors de l'enregistrement.");
      }
    } catch (error) {
      console.error("Erreur :", error);
      alert("Impossible de contacter le serveur.");
    }
  };

  return (
    <div>
      <h2>{isEditing ? "Modifier le formulaire" : "Créer un formulaire"}</h2>
      <label htmlFor="titre">Titre :</label>
      <input
        type="text"
        id="titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)} // Update title based on user input
      />
      <button onClick={handleSaveForm}>{isEditing ? "Mettre à jour" : "Enregistrer"}</button>
      <div ref={editorContainerRef} id="form-editor" style={{ width: "100%", height: "500px", border: "1px solid #ccc" }} />
    </div>
  );
};

export default FormEditor2;