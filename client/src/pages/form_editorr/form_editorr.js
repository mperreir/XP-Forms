import React, { useEffect, useRef, useState } from "react";
import { FormEditor } from "@bpmn-io/form-js-editor";
import "./form_editorr.css";

const FormEditor2 = () => {
  const editorContainerRef = useRef(null);
  const [formEditor, setFormEditor] = useState(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const schema = {
      type: "default",
      components: [
        {
          key: "creditor",
          label: "Creditor",
          type: "textfield",
          validate: {
            required: true,
          },
        },
      ],
    };

    const editor = new FormEditor({
      container: editorContainerRef.current,
    });

    editor
      .importSchema(schema)
      .then(() => {
        console.log("Schéma importé avec succès !");
      })
      .catch((err) => {
        console.error("Échec de l'importation du schéma :", err);
      });

    setFormEditor(editor);

    return () => {
      editor.destroy();
    };
  }, []);

  // Fonction pour enregistrer le formulaire dans PostgreSQL
  const handleSaveForm = async () => {
    if (formEditor) {
      const schema = await formEditor.getSchema();
      const formId = schema.id; // ID du formulaire
      const title = document.getElementById('titre').value; // Récupérer le titre saisi
  
      if (!title.trim()) {
        alert('Veuillez saisir un titre !');
        return;
      }
  
      try {
        const response = await fetch('http://localhost:5000/api/save-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: formId, title, json_data: schema }),
        });
  
        if (response.ok) {
          alert('Formulaire enregistré avec succès !');
        } else {
          alert('Erreur lors de l\'enregistrement.');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Impossible de contacter le serveur.');
      }
    } else {
      console.warn('L\'éditeur n\'est pas encore initialisé !');
    }
  };


  return (
    <div>
      <h2>Form Editor</h2>
      <label htmlFor="titre">Titre :</label>
      <input
        type="text"
        id="titre"
        name="titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button id="save" onClick={handleSaveForm}>
        Enregistrer
      </button>
      <div ref={editorContainerRef} id="form-editor" style={{ width: "100%", height: "500px", border: "1px solid #ccc" }} />
    </div>
  );
};

export default FormEditor2;
