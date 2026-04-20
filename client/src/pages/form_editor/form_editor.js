import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FormEditor as BPMNFormEditor } from "@bpmn-io/form-js-editor";
import Modal from "../../components/Modal";
import './form-js-editor.css';
import styles from "./form_editor.module.css";
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────

const parseStyleText = (text = "") => {
  const result = {};
  text.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) return;
    const property = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    if (!property || !value) return;
    result[property] = value;
  });
  return result;
};

const serializeStyleToText = (stylesObj = {}) =>
  Object.entries(stylesObj).map(([k, v]) => `${k}: ${v}`).join("\n");

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

const applyComponentStyles = (component, container) => {
  if (component.components) component.components.forEach(c => applyComponentStyles(c, container));
  if (!component.styles || Object.keys(component.styles).length === 0) return;

  const wrapper = container?.querySelector(`[data-id="${component.id}"]`);
  if (!wrapper) return;

  // Reset
  wrapper.removeAttribute("style");
  wrapper.querySelectorAll(".fjs-form-field-label, label, legend, h1,h2,h3,h4,h5,h6,p,span,strong,em")
    .forEach(el => el.removeAttribute("style"));

  const typographyProps = ["color", "font-size", "font-weight", "font-style", "text-decoration", "text-align", "font-family", "line-height", "letter-spacing"];

  Object.entries(component.styles).forEach(([property, value]) => {
    if (!value) return;
    wrapper.style.setProperty(property, value, "important");
    if (typographyProps.includes(property)) {
      wrapper.querySelectorAll(".fjs-form-field-label, label, legend, h1,h2,h3,h4,h5,h6,p,span,strong,em")
        .forEach(el => el.style.setProperty(property, value, "important"));
    }
  });

  // Empêche l'héritage sur les inputs
  wrapper.querySelectorAll("input, select, textarea").forEach(el => {
    el.style.setProperty("text-decoration", "none", "important");
    el.style.setProperty("font-weight", "normal", "important");
    el.style.setProperty("font-style", "normal", "important");
    el.style.setProperty("color", "initial", "important");
    el.style.setProperty("font-size", "initial", "important");
  });
};

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────

const FormEditor = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const editorContainerRef = useRef(null);
  const [formEditor, setFormEditor] = useState(null);
  const formEditorRef = useRef(null);
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get("group_id");
  const [notification, setNotification] = useState({ message: "", type: "" });
  const currentElementRef = useRef(null);
  const [stylePanel, setStylePanel] = useState({ visible: true, text: "" });
  const [componentSelected, setComponentSelected] = useState(false);

  const showModal = (title, message, onConfirm = null) =>
    setModal({ isOpen: true, title, message, onConfirm });
  const closeModal = () =>
    setModal({ isOpen: false, title: "", message: "", onConfirm: null });
  const showNotification = (message, type = "success", duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), duration);
  };

  const handleStylePanelApply = useCallback(async () => {
    const editor = formEditorRef.current;
    if (!editor || !currentElementRef.current) return;
    const schema = await editor.getSchema();
    const component = findComponentById(schema.components, currentElementRef.current.id);
    if (!component) return;
    component.styles = parseStyleText(stylePanel.text || "");
    await editor.importSchema(schema);
    setIsModified(true);
  }, [stylePanel.text]);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const editor = new BPMNFormEditor({ container: editorContainerRef.current });
    setFormEditor(editor);
    formEditorRef.current = editor;

    editorContainerRef.current.addEventListener("click", async (e) => {
      const wrapper = e.target.closest("[data-id]");
      if (!wrapper) {
        currentElementRef.current = null;
        setComponentSelected(false);
        setStylePanel({ visible: true, text: "" });
        return;
      }
      const componentId = wrapper.getAttribute("data-id");
      currentElementRef.current = { id: componentId };
      setComponentSelected(true);
      const schema = await editor.getSchema();
      const component = findComponentById(schema.components, componentId);
      setStylePanel({
        visible: true,
        text: serializeStyleToText(component?.styles || {}),
      });
    });

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
      requestAnimationFrame(() =>
        schema.components.forEach(c => applyComponentStyles(c, editorContainerRef.current))
      );
    });

    // ── Bouton Copy ──
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
    const formTitle = title.trim() || "Formulaire sans titre";

    try {
      const response = await fetch('/api/forms');
      const allForms = await response.json();
      const duplicate = allForms.find(f =>
        f.title.trim().toLowerCase() === formTitle.toLowerCase() && f.id !== formId
      );
      if (duplicate) {
        showNotification(t("A form with this title already exists."), "error");
        return;
      }
    } catch {
      showNotification(t("Unable to contact server."), "error");
      return;
    }

    const formData = { id: formId, title: formTitle, json_data: schema, group_id: groupId };
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
        <div className={styles.right} />
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
          style={{ flex: 1, height: "500px", paddingLeft: "1em", border: "1px solid #ccc", marginTop: "20px", overflow: "hidden" }}
        />

        {stylePanel.visible && (
          <div className={styles.stylePanel}>
            <div className={styles.stylePanelHeader}>
              <span>{t("Custom styles")}</span>
              <button
                className={styles.stylePanelClose}
                onClick={() => setStylePanel({ visible: false, text: "" })}
              >✕</button>
            </div>

            <textarea
              className={styles.stylePanelTextarea}
              value={stylePanel.text}
              onChange={(e) => setStylePanel(p => ({ ...p, text: e.target.value }))}
              rows={10}
              spellCheck={false}
              disabled={!componentSelected}
              placeholder={"font-weight: bold\ncolor: #e74c3c\nfont-size: 18px\nbackground-color: #fdf6e3\nborder-radius: 8px"}
            />

            <button
              className={styles.stylePanelApply}
              onClick={handleStylePanelApply}
              disabled={!componentSelected}
            >
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