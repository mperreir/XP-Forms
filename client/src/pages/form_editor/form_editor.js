import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormEditor as BPMNFormEditor } from "@bpmn-io/form-js-editor";
import Modal from "../../components/Modal";
import './form-js-editor.css';
import styles from "./form_editor.module.css"; 
import { useTranslation } from 'react-i18next';

const FormEditor = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const editorContainerRef = useRef(null);
  const [formEditor, setFormEditor] = useState(null);
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isModified, setIsModified] = useState(false); // Pour suivre les modifications
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get("group_id");
  const [notification, setNotification] = useState({ message: "", type: "" });
  const currentElementRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedFontSize, setSelectedFontSize] = useState("16px");

  const showModal = (title, message, onConfirm = null) => {
    setModal({ isOpen: true, title, message, onConfirm });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "", onConfirm: null });
  };

  const showNotification = (message, type = "success", duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
        setNotification({ message: "", type: "" });
    }, duration);
  };

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const editor = new BPMNFormEditor({
      container: editorContainerRef.current,
    });

    setFormEditor(editor);

    editorContainerRef.current.addEventListener("click", async (e) => {
      const wrapper = e.target.closest("[data-id]");
      if (!wrapper) {
        currentElementRef.current = null;
        setSelectedColor("#000000");
        setSelectedFontSize("16px")
        return;
      }
      const componentId = wrapper.getAttribute("data-id");
      currentElementRef.current = { id: componentId };
      const schema = await editor.getSchema();
      const component = findComponentById(schema.components, componentId);
      const color = component?.styles?.color || "#000000";
      const fontSize = component?.styles?.fontSize || "16px";
      setSelectedColor(color);
      setSelectedFontSize(fontSize)
    });

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

    editor.on("changed", async () => {
      const schema = await editor.getSchema();

      const STYLE_MAP = {
        bold: {
          property: "font-weight",
          value: "bold"
        },
        italic: {
          property: "font-style",
          value: "italic"
        },
        color: {
          property: "color",
          dynamic: true
        },
        fontSize: {
          property: "font-size",
          dynamic: true
        }
      };

      const applyStyles = (components) => {
        components.forEach((component) => {
          const wrapper = document.querySelector(
            `[data-id="${component.id}"]`
          );
          console.log(wrapper);
          if (!wrapper) return;
          // On boucle sur tous les styles définis
          Object.entries(STYLE_MAP).forEach(([styleKey, config]) => {
            const styleValue = component.styles?.[styleKey];
            const elementsToStyle = [wrapper];
            if (component.type === "text") {
              const textNodes = wrapper.querySelectorAll(
                "h1, h2, h3, h4, h5, h6, p, span"
              );
              elementsToStyle.push(...textNodes);
            }
            const labelNodes = wrapper.querySelectorAll(
              ".fjs-form-field-label"
            );
            elementsToStyle.push(...labelNodes);
            elementsToStyle.forEach(el => {
              if (styleValue !== undefined && styleValue !== false) {
                const value = config.dynamic
                  ? styleValue
                  : config.value;
                if (config.property === "color" && typeof value !== "string") {
                  return;
                }
                el.style.setProperty(
                  config.property,
                  value,
                  "important"
                );
              } else {
                el.style.removeProperty(config.property);
              }
            });
          });
          if (component.components) {
            applyStyles(component.components);
          }
        });
      };
      requestAnimationFrame(() => {
        applyStyles(schema.components);
      });
    });

    // Fonction utilitaire : recherche récursive d'un composant par ID
    const findComponentById = (components, targetId) => {
      for (const component of components) {
        if (component.id === targetId) return component;
        if (component.components) {
          const found = findComponentById(component.components, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    // Fonction utilitaire : trouver la position d'un composant dans le schéma
    const findComponentLocation = (components, targetId, parentComponent = null) => {
      for (let i = 0; i < components.length; i++) {
        if (components[i].id === targetId) {
          return { parent: parentComponent, index: i };
        }
        if (components[i].components) {
          const result = findComponentLocation(components[i].components, targetId, components[i]);
          if (result) return result;
        }
      }
      return null;
    };

    // Fonction utilitaire : générer un ID unique pour un composant
    const generateUniqueId = (componentType) => {
      return `${componentType}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // Fonction utilitaire : régénérer tous les IDs d'un composant et ses enfants
    const regenerateComponentIds = (component, componentType) => {
      component.id = generateUniqueId(componentType);
      if (component.key) {
        component.key = generateUniqueId(componentType);
      }
      if (component.components) {
        component.components.forEach(child => {
          regenerateComponentIds(child, child.type);
        });
      }
    };

    // Copier un composant et l'insérer juste après l'original
    const copyComponent = async (fieldId) => {
      const schema = editor.getSchema();
      const originalComponent = findComponentById(schema.components, fieldId);
      if (!originalComponent) return;

      // Cloner le composant (deep copy)
      const clonedComponent = JSON.parse(JSON.stringify(originalComponent));
      
      // Régénérer tous les IDs pour éviter les conflits
      regenerateComponentIds(clonedComponent, clonedComponent.type);
      
      // Trouver où insérer le clone (juste après l'original)
      const location = findComponentLocation(schema.components, fieldId);
      if (!location) return;

      const targetArray = location.parent ? location.parent.components : schema.components;
      targetArray.splice(location.index + 1, 0, clonedComponent);
      
      await editor.importSchema(schema);
      setIsModified(true);
    };

    // Note technique : Form.js ne fournit pas d'API pour étendre le context-pad.
    // On utilise un MutationObserver pour détecter l'apparition dynamique du context-pad
    // et y injecter notre bouton "Copy" de manière cohérente avec l'UI existante.
    const injectCopyButtonIntoContextPad = (contextPadNode) => {
      // Éviter les doublons
      if (contextPadNode.querySelector('.custom-copy-btn')) return;

      const removeButton = contextPadNode.querySelector('button[title^="Remove"]');
      const selectedElement = contextPadNode.closest('[data-id]');
      if (!removeButton || !selectedElement) return;

      const fieldId = selectedElement.getAttribute('data-id');
      const componentType = removeButton.title.replace('Remove ', '');

      // Créer le bouton Copy avec le même style que les boutons natifs
      const copyButton = document.createElement('button');
      copyButton.className = 'custom-copy-btn fjs-context-pad-item';
      copyButton.type = 'button';
      copyButton.title = `Copy ${componentType}`;
      copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none">
          <rect width="16" height="16" fill="#fff" rx="3" style="mix-blend-mode: multiply;"></rect>
          <path fill="currentcolor" d="M4 2h6v2H4V2zm8 0v2h2V2h-2zM2 6h2V4H2v2zm10 0h2V4h-2v2zM4 12H2v2h2v-2zm8 0v2h2v-2h-2zM2 8h2V6H2v2zm10 0h2V6h-2v2zM4 10H2v2h2v-2zm4-8h2v2H8V2zM6 14h2v-2H6v2zm2-4h2V8H8v2z"/>
        </svg>
      `;
      copyButton.onclick = () => copyComponent(fieldId);
      
      contextPadNode.appendChild(copyButton);
    };

    // Observer DOM pour détecter l'apparition du context-pad
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList?.contains('fjs-context-pad')) {
            injectCopyButtonIntoContextPad(node);
          }
        });
      });
    });

    observer.observe(editorContainerRef.current, {
      childList: true,
      subtree: true
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
    if (id) schema.id = id;
    const formTitle = title.trim() || "Formulaire sans titre";
    const formData = { id: formId, title: formTitle, json_data: schema, group_id: groupId };

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
        showNotification(isEditing ? t("Form updated!") : t("Form saved!"), "success")
      } else {
        console.error("Erreur serveur :", await response.json());
        showNotification(t("Error while saving."), "error");
      }
    } catch (error) {
      console.error("Erreur :", error);
      showNotification(t("Unable to contact server."), "error");
    }
  };

  const handleStyleChange = async (styleKey, value = null) => {
    if (!formEditor || !currentElementRef.current) return;
    const schema = await formEditor.getSchema();
    const findComponentById = (components, targetId) => {
      for (const component of components) {
        if (component.id === targetId) return component;
        if (component.components) {
          const found = findComponentById(component.components, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    const component = findComponentById(
      schema.components,
      currentElementRef.current.id
    );
    if (!component) return;
    if (!component.styles) component.styles = {};
    // color
    if (value !== null) {
      component.styles[styleKey] = value;
    } 
    // Toggle (bold / italic)
    else {
      component.styles[styleKey] =! component.styles[styleKey];
    }
    await formEditor.importSchema(schema);
  };

  const handleGoHome = () => {
    if (isModified) {
      showModal(
        t("Warning"),
        t("You have unsaved changes. Do you really want to leave this page?"),
        () => navigate("/accueil")
      );
    } else {
      navigate("/accueil");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.left}>
          <button className="btn" onClick={handleGoHome}>
            {t("Back to home")}
          </button>
        </div>
        <h2 className={styles.title}>
          {isEditing ? t("Edit form") : t("Create form")}
        </h2>
        <div className={styles.right}>
          <select
            className={styles.styleSelect}
            onChange={(e) => {
              if (!e.target.value) return;
              handleStyleChange(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">Styles</option>
            <option value="bold">Gras</option>
            <option value="italic">Italique</option>
          </select>
          <select 
            value={selectedFontSize}
            className={styles.fontSizeSelect}
            onChange={(e) => {
              setSelectedFontSize(e.target.value);
              handleStyleChange("fontSize", e.target.value);
            }}
          >
              <option value="12px">12</option>
              <option value="14px">14</option>
              <option value="16px">16</option>
              <option value="18px">18</option>
              <option value="20px">20</option>
              <option value="24px">24</option>
              <option value="32px">32</option>
              <option value="64px">64</option>
          </select>
          <input
            type="color"
            className={styles.colorPicker}
            value={selectedColor}
            onChange={(e) => {
              handleStyleChange("color", e.target.value);
              setSelectedColor(e.target.value);
            }}
          />
        </div>
      </div>

      <div className={styles.titleContainer}>
        <label htmlFor="titre">{t("Title:")}</label>
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
          {isEditing ? t("Update") : t("Save")}
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
      {notification.message && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.message}
        </div>
      )}
    </div>
  );
}; 

export default FormEditor;
