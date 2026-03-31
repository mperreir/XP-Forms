import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormEditor as BPMNFormEditor } from "@bpmn-io/form-js-editor";
import Modal from "../../components/Modal";
import './form-js-editor.css';
import styles from "./form_editor.module.css";
import { useTranslation } from 'react-i18next';

// Les clés "dynamic" prennent la valeur telle quelle
// Les clés non-dynamic ont une valeur fixe (toggle)
const STYLE_MAP = {
  bold:            { property: "font-weight",       value: "bold" },
  italic:          { property: "font-style",         value: "italic" },
  underline:       { property: "text-decoration",    value: "underline" },
  color:           { property: "color",              dynamic: true },
  fontSize:        { property: "font-size",          dynamic: true },
  backgroundColor: { property: "background-color",   dynamic: true },
  borderRadius:    { property: "border-radius",      dynamic: true },
  padding:         { property: "padding",            dynamic: true },
  margin:          { property: "margin",             dynamic: true },
  border:          { property: "border",             dynamic: true },
  opacity:         { property: "opacity",            dynamic: true },
  textAlign:       { property: "text-align",         dynamic: true },
  width:           { property: "width",              dynamic: true },
  // Ajouter autant de clés que nécessaire
};

// Référence pour le panneau de styles : clés connues + exemples
const STYLE_REFERENCE = [
  { key: "bold",            example: "true",      desc: "Texte en gras" },
  { key: "italic",          example: "true",      desc: "Texte en italique" },
  { key: "underline",       example: "true",      desc: "Texte souligné" },
  { key: "color",           example: "#e74c3c",   desc: "Couleur du texte" },
  { key: "fontSize",        example: "18px",      desc: "Taille de la police" },
  { key: "backgroundColor", example: "#fdf6e3",   desc: "Couleur de fond" },
  { key: "borderRadius",    example: "8px",       desc: "Arrondi des coins" },
  { key: "padding",         example: "8px 12px",  desc: "Espacement intérieur" },
  { key: "margin",          example: "0 0 16px 0",desc: "Espacement extérieur" },
  { key: "border",          example: "2px solid #ccc", desc: "Bordure" },
  { key: "opacity",         example: "0.7",       desc: "Transparence (0 à 1)" },
  { key: "textAlign",       example: "center",    desc: "Alignement du texte" },
  { key: "width",           example: "50%",       desc: "Largeur du composant" },
];


// Parse le texte brut du panneau ("bold: true\ncolor: red") en objet styles
const parseStyleText = (text) => {
  const result = {};
  text.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) return;
    const key = line.slice(0, colonIndex).trim();
    const val = line.slice(colonIndex + 1).trim();
    if (!key || !val) return;
    // Convertir "true"/"false" en booléen
    if (val === "true")  { result[key] = true;  return; }
    if (val === "false") { result[key] = false; return; }
    result[key] = val;
  });
  return result;
};

// Sérialise un objet styles en texte pour l'afficher dans le panneau
const serializeStyleToText = (stylesObj = {}) => {
  return Object.entries(stylesObj)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
};

// Cherche récursivement un composant par ID
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

// Applique les styles d'un composant sur le DOM
const applyComponentStyles = (component) => {
  const wrapper = document.querySelector(`[data-id="${component.id}"]`);
  if (!wrapper) return;

  const elementsToStyle = [wrapper];
  if (component.type === "text") {
    elementsToStyle.push(...wrapper.querySelectorAll("h1,h2,h3,h4,h5,h6,p,span"));
  }
  elementsToStyle.push(...wrapper.querySelectorAll(".fjs-form-field-label"));

  // Clés connues via STYLE_MAP
  Object.entries(STYLE_MAP).forEach(([styleKey, config]) => {
    const styleValue = component.styles?.[styleKey];
    elementsToStyle.forEach((el) => {
      if (styleValue !== undefined && styleValue !== false) {
        const cssValue = config.dynamic ? styleValue : config.value;
        if (config.property === "color" && typeof cssValue !== "string") return;
        el.style.setProperty(config.property, cssValue, "important");
      } else {
        el.style.removeProperty(config.property);
      }
    });
  });

  // Clés inconnues (CSS brut saisi par le client, non dans STYLE_MAP)
  // On les applique directement sur le wrapper
  Object.entries(component.styles || {}).forEach(([key, value]) => {
    if (STYLE_MAP[key]) return; // déjà traité
    if (value === false || value === undefined) {
      wrapper.style.removeProperty(key);
    } else {
      wrapper.style.setProperty(key, value === true ? "1" : String(value), "important");
    }
  });

  if (component.components) {
    component.components.forEach(applyComponentStyles);
  }
};


const FormEditor = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const editorContainerRef = useRef(null);
  const [formEditor, setFormEditor] = useState(null);
  const formEditorRef = useRef(null); // ref miroir pour les callbacks
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get("group_id");
  const [notification, setNotification] = useState({ message: "", type: "" });
  const currentElementRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedFontSize, setSelectedFontSize] = useState("16px");
  const [showStyleHelp, setShowStyleHelp] = useState(false);

  // Style panel 
  const [stylePanel, setStylePanel] = useState({ visible: false, text: "" });

  const showModal = (title, message, onConfirm = null) =>
    setModal({ isOpen: true, title, message, onConfirm });
  const closeModal = () =>
    setModal({ isOpen: false, title: "", message: "", onConfirm: null });

  const showNotification = (message, type = "success", duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), duration);
  };

  // Applique les styles issus du panneau sur le composant sélectionné
  const handleStylePanelApply = useCallback(async () => {
    const editor = formEditorRef.current;
    if (!editor || !currentElementRef.current) return;

    const schema = await editor.getSchema();
    const component = findComponentById(schema.components, currentElementRef.current.id);
    if (!component) return;

    component.styles = parseStyleText(stylePanel.text);
    await editor.importSchema(schema);
    setIsModified(true);
  }, [stylePanel.text]);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const editor = new BPMNFormEditor({ container: editorContainerRef.current });
    setFormEditor(editor);
    formEditorRef.current = editor;

    // Sélection d'un composant => ouvre/met à jour le panneau
    editorContainerRef.current.addEventListener("click", async (e) => {
      setShowStyleHelp(false);
      const wrapper = e.target.closest("[data-id]");
      if (!wrapper) {
        currentElementRef.current = null;
        setSelectedColor("#000000");
        setSelectedFontSize("16px");
        setStylePanel({ visible: false, text: "" });
        return;
      }
      const componentId = wrapper.getAttribute("data-id");
      currentElementRef.current = { id: componentId };

      const schema = await editor.getSchema();
      const component = findComponentById(schema.components, componentId);
      const color = component?.styles?.color || "#000000";
      const fontSize = component?.styles?.fontSize || "16px";
      setSelectedColor(color);
      setSelectedFontSize(fontSize);
      // Ouvrir le panneau avec les styles existants
      setStylePanel({
        visible: true,
        text: serializeStyleToText(component?.styles || {}),
      });
    });

    // Chargement du schéma
    if (id) {
      fetch(`/api/forms/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.json_data) throw new Error("Schéma vide");
          editor.importSchema(data.json_data);
          setTitle(data.title || "");
          setIsEditing(true);
        })
        .catch((err) => console.error("Erreur chargement :", err));
    } else {
      editor.importSchema({ type: "default", components: [] });
    }

    editor.on("changed", () => setIsModified(true));
    editor.on("changed", async () => {
      const schema = await editor.getSchema();
      requestAnimationFrame(() => schema.components.forEach(applyComponentStyles));
    });

    // Bouton Copy dans le context-pad
    const findComponentLocation = (components, targetId, parentComponent = null) => {
      for (let i = 0; i < components.length; i++) {
        if (components[i].id === targetId) return { parent: parentComponent, index: i };
        if (components[i].components) {
          const result = findComponentLocation(components[i].components, targetId, components[i]);
          if (result) return result;
        }
      }
      return null;
    };
    const generateUniqueId = (type) => `${type}_${Math.random().toString(36).substr(2, 9)}`;
    const regenerateComponentIds = (component) => {
      component.id = generateUniqueId(component.type);
      if (component.key) component.key = generateUniqueId(component.type);
      if (component.components) component.components.forEach(regenerateComponentIds);
    };
    const copyComponent = async (fieldId) => {
      const schema = editor.getSchema();
      const original = findComponentById(schema.components, fieldId);
      if (!original) return;
      const clone = JSON.parse(JSON.stringify(original));
      regenerateComponentIds(clone);
      const location = findComponentLocation(schema.components, fieldId);
      if (!location) return;
      const arr = location.parent ? location.parent.components : schema.components;
      arr.splice(location.index + 1, 0, clone);
      await editor.importSchema(schema);
      setIsModified(true);
    };

    const injectCopyButton = (contextPadNode) => {
      if (contextPadNode.querySelector('.custom-copy-btn')) return;
      const removeButton = contextPadNode.querySelector('button[title^="Remove"]');
      const selectedElement = contextPadNode.closest('[data-id]');
      if (!removeButton || !selectedElement) return;
      const fieldId = selectedElement.getAttribute('data-id');
      const componentType = removeButton.title.replace('Remove ', '');
      const btn = document.createElement('button');
      btn.className = 'custom-copy-btn fjs-context-pad-item';
      btn.type = 'button';
      btn.title = `Copy ${componentType}`;
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"><rect width="16" height="16" fill="#fff" rx="3" style="mix-blend-mode:multiply"></rect><path fill="currentcolor" d="M4 2h6v2H4V2zm8 0v2h2V2h-2zM2 6h2V4H2v2zm10 0h2V4h-2v2zM4 12H2v2h2v-2zm8 0v2h2v-2h-2zM2 8h2V6H2v2zm10 0h2V6h-2v2zM4 10H2v2h2v-2zm4-8h2v2H8V2zM6 14h2v-2H6v2zm2-4h2V8H8v2z"/></svg>`;
      btn.onclick = () => copyComponent(fieldId);
      contextPadNode.appendChild(btn);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (node.classList?.contains('fjs-context-pad')) injectCopyButton(node);
        })
      );
    });
    observer.observe(editorContainerRef.current, { childList: true, subtree: true });

    return () => { observer.disconnect(); editor.destroy(); };
  }, [id]);

  const handleSaveForm = async () => {
    if (!formEditor) return;
    const schema = await formEditor.getSchema();
    const formId = id || schema.id || `Form_${Date.now()}`;
    if (id) schema.id = id;
    const formData = {
      id: formId,
      title: title.trim() || "Formulaire sans titre",
      json_data: schema,
      group_id: groupId,
    };
    try {
      const response = await fetch(id ? `/api/forms/${formId}` : "/api/save-form", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setIsModified(false);
        showNotification(isEditing ? t("Form updated!") : t("Form saved!"), "success");
      } else {
        showNotification(t("Error while saving."), "error");
      }
    } catch {
      showNotification(t("Unable to contact server."), "error");
    }
  };

  const handleStyleChange = async (styleKey, value = null) => {
    if (!formEditor || !currentElementRef.current) return;
    const schema = await formEditor.getSchema();
    const component = findComponentById(schema.components, currentElementRef.current.id);
    if (!component) return;
    if (!component.styles) component.styles = {};
    component.styles[styleKey] = value !== null ? value : !component.styles[styleKey];
    // Mettre à jour le texte du panneau pour rester en sync
    setStylePanel((prev) => ({ ...prev, text: serializeStyleToText(component.styles) }));
    await formEditor.importSchema(schema);
  };

  const handleGoHome = () => {
    if (isModified) {
      showModal(t("Warning"), t("You have unsaved changes. Do you really want to leave this page?"), () => navigate("/accueil"));
    } else {
      navigate("/accueil");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.left}>
          <button className="btn" onClick={handleGoHome}>{t("Back to home")}</button>
        </div>
        <h2 className={styles.title}>{isEditing ? t("Edit form") : t("Create form")}</h2>
        <div className={styles.right}>
        </div>
      </div>

      <div className={styles.titleContainer}>
        <label htmlFor="titre">{t("Title:")}</label>
        <input
          type="text" id="titre" value={title}
          onChange={(e) => { setTitle(e.target.value); setIsModified(true); }}
          className={styles.titleInput}
        />
        <button onClick={handleSaveForm} className={styles.saveButton}>
          {isEditing ? t("Update") : t("Save")}
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <div
          ref={editorContainerRef}
          id="form-editor"
          style={{ flex: 1, height: "500px", border: "1px solid #ccc", marginTop: "20px" }}
        />

        {stylePanel.visible && (
          <div className={styles.stylePanel}>
            <div className={styles.stylePanelHeader}>
              <span>🎨 {t("Custom styles")}</span>

              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  className={styles.styleHelpBtn}
                  onClick={() => setShowStyleHelp((prev) => !prev)}
                  title="Voir les styles disponibles"
                >
                  ?
                </button>

                <button
                  className={styles.stylePanelClose}
                  onClick={() => setStylePanel({ visible: false, text: "" })}
                >
                  ✕
                </button>
              </div>
            </div>
            {showStyleHelp && (
              <div className={styles.stylePanelHint}>
                {STYLE_REFERENCE.map((style) => (
                  <div key={style.key} style={{ marginBottom: "6px" }}>
                    <code>{style.key}: {style.example}</code>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      {style.desc}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <textarea
              className={styles.stylePanelTextarea}
              value={stylePanel.text}
              onChange={(e) => setStylePanel((prev) => ({ ...prev, text: e.target.value }))}
              rows={10}
              spellCheck={false}
            />
            <button className={styles.stylePanelApply} onClick={handleStylePanelApply}>
              {t("Apply")}
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} onClose={closeModal} onConfirm={modal.onConfirm} />
      {notification.message && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default FormEditor;