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
  const [isModified, setIsModified] = useState(false); // Pour suivre les modifications
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

  const showModal = (title, message, onConfirm = null) => {
    setModal({ isOpen: true, title, message, onConfirm });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "", onConfirm: null });
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

    // Détection des modifications dans l'éditeur
    editor.on("changed", () => {
      setIsModified(true);
    });

    const copyComponent = async (fieldId) => {
      const schema = editor.getSchema();
      
      const findComponent = (components, id) => {
        for (const comp of components) {
          if (comp.id === id) return comp;
          if (comp.components) {
            const found = findComponent(comp.components, id);
            if (found) return found;
          }
        }
      };
      
      const original = findComponent(schema.components, fieldId);
      const clone = JSON.parse(JSON.stringify(original));
      const newId = () => `${clone.type}_${Math.random().toString(36).substr(2, 9)}`;
      
      clone.id = newId();
      clone.key = newId();
      
      const regenerateIds = (comp) => {
        comp.components?.forEach(child => {
          child.id = newId();
          child.key = newId();
          regenerateIds(child);
        });
      };
      regenerateIds(clone);
      
      const findLocation = (components, id, parent = null) => {
        for (let i = 0; i < components.length; i++) {
          if (components[i].id === id) return { parent, index: i };
          if (components[i].components) {
            const result = findLocation(components[i].components, id, components[i]);
            if (result) return result;
          }
        }
      };
      
      const location = findLocation(schema.components, fieldId);
      const targetArray = location.parent ? location.parent.components : schema.components;
      targetArray.splice(location.index + 1, 0, clone);
      await editor.importSchema(schema);
      setIsModified(true);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList?.contains('fjs-context-pad') && !node.querySelector('.custom-copy-btn')) {
            const removeBtn = node.querySelector('button[title^="Remove"]');
            const fieldId = node.closest('[data-id]').getAttribute('data-id');
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'custom-copy-btn fjs-context-pad-item';
            copyBtn.type = 'button';
            copyBtn.title = removeBtn.title.replace('Remove', 'Copy');
            copyBtn.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
                <rect width="16" height="16" fill="#fff" rx="3" style="mix-blend-mode: multiply;"></rect>
                <path fill="currentcolor" d="M4 2h6v2H4V2zm8 0v2h2V2h-2zM2 6h2V4H2v2zm10 0h2V4h-2v2zM4 12H2v2h2v-2zm8 0v2h2v-2h-2zM2 8h2V6H2v2zm10 0h2V6h-2v2zM4 10H2v2h2v-2zm4-8h2v2H8V2zM6 14h2v-2H6v2zm2-4h2V8H8v2z"/>
              </svg>
            `;
            copyBtn.onclick = () => copyComponent(fieldId);
            node.appendChild(copyBtn);
          }
        });
      });
    });

    // Démarrer la surveillance du DOM
    observer.observe(editorContainerRef.current, {
      childList: true,  // Surveiller les ajouts/suppressions d'éléments
      subtree: true     // Surveiller aussi les sous-éléments
    });

    return () => {
      observer.disconnect();
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
        setIsModified(false); // Les modifications sont enregistrées
        showModal("Succès", isEditing ? "Formulaire mis à jour !" : "Formulaire enregistré !", () => {
          navigate("/accueil");
        });
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
    if (isModified) {
      showModal(
        "Attention",
        "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ?",
        () => navigate("/accueil")
      );
    } else {
      navigate("/accueil");
    }
  };

  return (
    <div className={styles.container}>
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
          onChange={(e) => {
            setTitle(e.target.value);
            setIsModified(true); // Le titre est une modification
          }}
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
          marginTop: "20px"
        }}
      />

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
}; 

export default FormEditor;
