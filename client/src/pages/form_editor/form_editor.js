import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormEditor as BPMNFormEditor } from "@bpmn-io/form-js-editor";
import Modal from "../../components/Modal";
import './form-js-editor.css';
import styles from "./form_editor.module.css"; 


const FormEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorContainerRef = useRef(null);
  const [formEditor, setFormEditor] = useState(null);
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "" });

  const showModal = (title, message) => {
    setModal({ isOpen: true, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "" });
  };

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const editor = new BPMNFormEditor({
      container: editorContainerRef.current,
    });

    setFormEditor(editor);

    if (id) {
      fetch(`/api/forms/${id}`)
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
      const url = id ? `/api/forms/${formId}` : "/api/save-form";
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showModal("Succès", isEditing ? "Formulaire mis à jour !" : "Formulaire enregistré !");
        navigate("/accueil");
      } else {
        console.error("Erreur serveur :", await response.json());
        showModal("Erreur", "Erreur lors de l'enregistrement.");
      }
    } catch (error) {
      console.error("Erreur :", error);
      showModal("Erreur", "Impossible de contacter le serveur.");
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
  <>
    <div className={styles.headerContainer}>
      <h2 className={styles.pageTitle}>
        {isEditing ? "Modifier le formulaire" : "Créer un formulaire"}
      </h2>
      <button className="btn" onClick={handleGoHome}>
        Retour à l'accueil
      </button>
    </div>

    <div className={styles.titleContainer}>
      <label htmlFor="titre">Titre :</label>
      <input
        type="text"
        id="titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={styles.titleInput}
      />
      <button onClick={handleSaveForm} className={styles.saveButton}>
        {isEditing ? "Mettre à jour" : "Enregistrer"}
      </button>
    </div>

    <div
      ref={editorContainerRef}
      id="form-editor"
      style={{
        width: "100%",
        height: "500px",
        border: "1px solid #ccc",
        marginTop: "20px",
      }}
    />

    <Modal
      isOpen={modal.isOpen}
      title={modal.title}
      message={modal.message}
      onClose={closeModal}
    />
  </>
);
}; 

export default FormEditor;
