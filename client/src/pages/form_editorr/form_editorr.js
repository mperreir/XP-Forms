import React, { useEffect, useRef, useState } from "react";
import { FormEditor } from "@bpmn-io/form-js-editor";
import { useParams, useNavigate } from "react-router-dom";
import "./form_editorr.css";

const FormEditor2 = () => {
  const { id } = useParams(); // Récupération de l'ID du formulaire depuis l'URL
  const navigate = useNavigate();
  const editorContainerRef = useRef(null);
  const [formEditor, setFormEditor] = useState(null);
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false); // Mode édition ou création

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const editor = new FormEditor({
      container: editorContainerRef.current,
    });

    setFormEditor(editor);

    if (id) {
      // Charger un formulaire existant
      fetch(`http://localhost:5000/api/forms/${id}`)
        .then((response) => {
          if (!response.ok) throw new Error("Erreur lors de la récupération du formulaire");
          return response.json();
        })
        .then((data) => {
          if (!data.json_data || Object.keys(data.json_data).length === 0) {
            throw new Error("Le schéma du formulaire est vide ou invalide !");
          }
          editor.importSchema(data.json_data); // Charger le schéma du formulaire
          setTitle(data.title || ""); // Charger le titre
          setIsEditing(true); // Activer le mode édition
        })
        .catch((err) => console.error("Erreur lors du chargement du formulaire :", err));
    } else {
      // Nouveau formulaire (par défaut)
      const defaultSchema = {
        type: "default",
        components: [],
      };
      editor.importSchema(defaultSchema);
    }

    return () => {
      editor.destroy();
    };
  }, [id]);

  // Fonction pour enregistrer ou modifier un formulaire
  const handleSaveForm = async () => {
    if (!formEditor) {
      console.warn("L'éditeur n'est pas encore initialisé !");
      return;
    }

    const schema = await formEditor.getSchema();
    const formId = id || `Form_${Date.now()}`; // Générer un ID unique si nouveau
    const formTitle = title.trim();

    if (!formTitle) {
      alert("Veuillez saisir un titre !");
      return;
    }

    const formData = { id: formId, title: formTitle, json_data: schema };
    console.log("Données envoyées au serveur :", formData); // Debugging

    try {
      const url = id ? `http://localhost:5000/api/forms/${formId}` : "http://localhost:5000/api/save-form";
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Formulaire enregistré avec succès !");
        navigate("/"); // Redirection vers l'accueil après l'enregistrement
      } else {
        console.error("Erreur serveur :", result);
        alert("Erreur lors de l'enregistrement : " + (result.error || "Inconnue"));
      }
    } catch (error) {
      console.error("Erreur :", error);
      alert("Impossible de contacter le serveur.");
    }
  };

  return (
    <div>
      <h2>{isEditing ? "Modifier le formulaire" : "Créer un nouveau formulaire"}</h2>
      <label htmlFor="titre">Titre :</label>
      <input
        type="text"
        id="titre"
        name="titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button id="save" onClick={handleSaveForm}>
        {isEditing ? "Mettre à jour" : "Enregistrer"}
      </button>
      <div ref={editorContainerRef} id="form-editor" style={{ width: "100%", height: "500px", border: "1px solid #ccc" }} />
    </div>
  );
};

export default FormEditor2;
