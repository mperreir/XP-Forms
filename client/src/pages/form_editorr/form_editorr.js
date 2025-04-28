import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormEditor } from "@bpmn-io/form-js-editor";
import "./form_editorr.css";
import './form-js-editor.css';

const FormEditor2 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorContainerRef = useRef(null);
  const [formEditor, setFormEditor] = useState(null);
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const editor = new FormEditor({
      container: editorContainerRef.current,
    });

    setFormEditor(editor);

    if (id) {
      fetch(`http://localhost:5000/api/forms/${id}`)
        .then((response) => response.json())
        .then((data) => {
          if (!data.json_data) throw new Error("Le schéma du formulaire est vide !");
          editor.importSchema(data.json_data);
          setTitle(data.title || "");
          setIsEditing(true);
          console.log(data);
        })
        .catch((err) => console.error("Erreur de chargement :", err));
    } else {
      const defaultSchema = { type: "default", components: [] };
      editor.importSchema(defaultSchema);
    }

    return () => {
      editor.destroy();
    };
  }, [id]);

  const handleSaveForm = async () => {
    if (!formEditor) {
      console.warn("L'éditeur n'est pas encore prêt !");
      return;
    }

    const schema = await formEditor.getSchema();
    const formId = id || schema.id || `Form_${Date.now()}`;
    const formTitle = title.trim() || "Formulaire sans titre";

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

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div>
      <h2>{isEditing ? "Modifier le formulaire" : "Créer un formulaire"}</h2>
      <button className="btn" onClick={handleGoHome}>
        Retour à l'accueil
      </button>
      <br />
      <label htmlFor="titre">Titre :</label>
      <input
        type="text"
        id="titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <button onClick={handleSaveForm} style={{ marginRight: "10px" }}>
          {isEditing ? "Mettre à jour" : "Enregistrer"}
        </button>
      </div>
      <div ref={editorContainerRef} id="form-editor" style={{ width: "100%", height: "500px", border: "1px solid #ccc" }} />
    </div>
  );
};

export default FormEditor2;
