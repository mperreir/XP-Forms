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

// Transforme le texte du panneau de styles (une ligne "propriété: valeur")
// en objet de styles. Les préfixes "label." et "option." sont rangés dans des sous-objets
const parseStyleText = (text = "") => {
  const result = {};
  text.split("\n").forEach((line) => {
    const colonIndex = line.indexOf(":");
    // Ligne sans ":" : on l'ignore
    if (colonIndex === -1) return;
    const property = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    if (!property || !value) return;

    if (property.startsWith("label.")) {
      // Style appliqué au libellé du champ
      const cssProp = property.slice("label.".length);
      if (!result.label) result.label = {};
      result.label[cssProp] = value;
    } else if (property.startsWith("option.")) {
      // Style appliqué aux options (cases à cocher, boutons radio...)
      const cssProp = property.slice("option.".length);
      if (!result.option) result.option = {};
      result.option[cssProp] = value;
    } else {
      // Style appliqué au champ en entier
      result[property] = value;
    }
  });
  return result;
};

// Fait l'inverse : objet de styles -> texte affiché dans le panneau
const serializeStyleToText = (stylesObj = {}) => {
  const lines = [];
  Object.entries(stylesObj).forEach(([k, v]) => {
    if (k === "label" && typeof v === "object") {
      Object.entries(v).forEach(([prop, val]) => lines.push(`label.${prop}: ${val}`));
    } else if (k === "option" && typeof v === "object") {
      Object.entries(v).forEach(([prop, val]) => lines.push(`option.${prop}: ${val}`));
    } else {
      lines.push(`${k}: ${v}`);
    }
  });
  return lines.join("\n");
};

// Cherche un composant par son id, y compris dans les groupes imbriqués (récursif)
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

// Applique visuellement les styles d'un composant sur son élément dans l'éditeur
const applyComponentStyles = (component, container) => {
  // On commence par les enfants
  if (component.components) component.components.forEach(c => applyComponentStyles(c, container));
  // Rien à faire si le composant n'a pas de style
  if (!component.styles || Object.keys(component.styles).length === 0) return;

  // Élément HTML correspondant au composant
  const wrapper = container?.querySelector(`[data-id="${component.id}"]`);
  if (!wrapper) return;

  // Reset : on enlève les anciens styles avant de réappliquer
  wrapper.removeAttribute("style");
  wrapper.querySelectorAll(".fjs-form-field-label, label, legend, h1,h2,h3,h4,h5,h6,p,span,strong,em")
    .forEach(el => el.removeAttribute("style"));

  // Propriétés de texte qu'on propage aussi aux éléments à l'intérieur du champ
  const typographyProps = ["color", "font-size", "font-weight", "font-style", "text-decoration", "text-align", "font-family", "line-height", "letter-spacing"];

  // Styles du wrapper (tout ce qui n'est pas label. ou option.)
  Object.entries(component.styles).forEach(([property, value]) => {
    if (property === "label" || property === "option") return;
    if (!value) return;
    // "important" pour passer devant le CSS de form-js
    wrapper.style.setProperty(property, value, "important");
    if (typographyProps.includes(property)) {
      wrapper.querySelectorAll(".fjs-form-field-label, label, legend, h1,h2,h3,h4,h5,h6,p,span,strong,em")
        .forEach(el => el.style.setProperty(property, value, "important"));
    }
  });

  // Styles label. : uniquement le titre du champ (pas les libellés des options)
  if (component.styles.label) {
    const titleLabel = wrapper.querySelector(".fjs-form-field-label:not(.fjs-inline-label .fjs-form-field-label)");
    if (titleLabel) {
      Object.entries(component.styles.label).forEach(([property, value]) => {
        if (!value) return;
        titleLabel.style.setProperty(property, value, "important");
      });
    }
  }

  // Styles option. : uniquement les libellés des options
  if (component.styles.option) {
    const optionLabels = [...wrapper.querySelectorAll(".fjs-inline-label .fjs-form-field-label")];
    Object.entries(component.styles.option).forEach(([property, value]) => {
      if (!value) return;
      optionLabels.forEach(el => el.style.setProperty(property, value, "important"));
    });
  }

  // Empêche l'héritage sur les inputs (sinon ils prendraient le gras, la couleur, etc.)
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

// Page de création / modification d'un formulaire (éditeur form-js + panneau de styles)
const FormEditor = () => {
  const { t } = useTranslation();
  const { id } = useParams(); // id du formulaire si on est en modification, sinon undefined
  const navigate = useNavigate();
  const editorContainerRef = useRef(null); // div dans laquelle form-js s'affiche
  const [formEditor, setFormEditor] = useState(null);
  const formEditorRef = useRef(null); // même éditeur, accessible dans les callbacks sans souci de closure
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(false); // true = modification, false = création
  const [isModified, setIsModified] = useState(false); // il y a des changements non sauvegardés
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  // Groupe de destination éventuel, passé dans l'URL (?group_id=...)
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get("group_id");
  const [notification, setNotification] = useState({ message: "", type: "" });
  // Composant actuellement sélectionné dans l'éditeur
  const currentElementRef = useRef(null);
  // Panneau de styles personnalisés (texte de la zone de saisie)
  const [stylePanel, setStylePanel] = useState({ visible: true, text: "" });
  const [componentSelected, setComponentSelected] = useState(false);
  

  // Affiche / ferme la modale de confirmation
  const showModal = (title, message, onConfirm = null) =>
    setModal({ isOpen: true, title, message, onConfirm });
  const closeModal = () =>
    setModal({ isOpen: false, title: "", message: "", onConfirm: null });
  // Notification temporaire (disparaît après "duration" ms)
  const showNotification = (message, type = "success", duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), duration);
  };

  // Clic sur "Appliquer" : enregistre les styles saisis dans le composant sélectionné
  const handleStylePanelApply = useCallback(async () => {
    const editor = formEditorRef.current;
    if (!editor || !currentElementRef.current) return;
    const schema = await editor.getSchema();
    const component = findComponentById(schema.components, currentElementRef.current.id);
    if (!component) return;
    component.styles = parseStyleText(stylePanel.text || "");
    // On réimporte le schéma pour que l'éditeur se mette à jour
    await editor.importSchema(schema);
    setIsModified(true);
  }, [stylePanel.text]);

  // Initialisation de l'éditeur (et rechargement si l'id change)
  useEffect(() => {
    if (!editorContainerRef.current) return;

    // Création de l'éditeur form-js
    const editor = new BPMNFormEditor({ container: editorContainerRef.current });
    setFormEditor(editor);
    formEditorRef.current = editor;

    // Clic dans l'éditeur : on repère le composant cliqué et on affiche ses styles dans le panneau
    editorContainerRef.current.addEventListener("click", async (e) => {
      const wrapper = e.target.closest("[data-id]");
      if (!wrapper) {
        // Clic dans le vide : plus rien de sélectionné
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
      // Mode modification : on charge le formulaire existant
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
      // Mode création : on part d'un formulaire vide
      editor.importSchema({ type: "default", components: [] });
    }

    // À chaque modification : on marque le formulaire comme modifié...
    editor.on("changed", () => setIsModified(true));
    // ...et on réapplique les styles personnalisés (form-js les écrase à chaque rendu)
    editor.on("changed", async () => {
      const schema = await editor.getSchema();
      // requestAnimationFrame : on attend que l'éditeur ait fini de redessiner
      requestAnimationFrame(() =>
        schema.components.forEach(c => applyComponentStyles(c, editorContainerRef.current))
      );
    });

    // ── Bouton Copy ──
    // On ajoute à la main un bouton "Copier" dans la barre d'actions de chaque champ

    // Retrouve où se trouve un composant : son parent et sa position dans la liste
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
    // Génère un identifiant aléatoire du type "textfield_a1b2c3d4e"
    const generateUniqueId = (type) => `${type}_${Math.random().toString(36).substr(2, 9)}`;
    // Donne de nouveaux ids au composant copié (et à ses enfants) pour éviter les doublons
    const regenerateComponentIds = (component) => {
      component.id = generateUniqueId(component.type);
      if (component.key) component.key = generateUniqueId(component.type);
      if (component.components) component.components.forEach(regenerateComponentIds);
    };
    // Duplique un champ et l'insère juste après l'original
    const copyComponent = async (fieldId) => {
      const schema = editor.getSchema();
      const original = findComponentById(schema.components, fieldId);
      if (!original) return;
      // Copie profonde pour ne pas modifier l'original
      const clone = JSON.parse(JSON.stringify(original));
      regenerateComponentIds(clone);
      const location = findComponentLocation(schema.components, fieldId);
      if (!location) return;
      const arr = location.parent ? location.parent.components : schema.components;
      arr.splice(location.index + 1, 0, clone);
      await editor.importSchema(schema);
      setIsModified(true);
    };
    // Ajoute le bouton "Copy" à côté du bouton "Remove" de la barre d'actions
    const injectCopyButton = (contextPadNode) => {
      // Déjà ajouté : on ne le remet pas
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
      // Icône SVG du bouton
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"><rect width="16" height="16" fill="#fff" rx="3" style="mix-blend-mode:multiply"></rect><path fill="currentcolor" d="M4 2h6v2H4V2zm8 0v2h2V2h-2zM2 6h2V4H2v2zm10 0h2V4h-2v2zM4 12H2v2h2v-2zm8 0v2h2v-2h-2zM2 8h2V6H2v2zm10 0h2V6h-2v2zM4 10H2v2h2v-2zm4-8h2v2H8V2zM6 14h2v-2H6v2zm2-4h2V8H8v2z"/></svg>`;
      btn.onclick = () => copyComponent(fieldId);
      contextPadNode.appendChild(btn);
    };
    // Surveille le DOM : dès qu'une barre d'actions apparaît, on y injecte le bouton
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (node.classList?.contains('fjs-context-pad')) injectCopyButton(node);
        })
      );
    });
    observer.observe(editorContainerRef.current, { childList: true, subtree: true });

    // Nettoyage quand on quitte la page : on arrête l'observateur et on détruit l'éditeur
    return () => { observer.disconnect(); editor.destroy(); };
  }, [id]);

  // Sauvegarde le formulaire (création ou mise à jour)
  const handleSaveForm = async () => {
    if (!formEditor) return;
    const schema = await formEditor.getSchema();
    const formId = id || schema.id || `Form_${Date.now()}`;
    if (id) schema.id = id;
    const formTitle = title.trim() || "Formulaire sans titre";

    // Vérifie qu'aucun autre formulaire n'a déjà ce titre
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

    // PUT si on modifie un formulaire existant, POST si on en crée un nouveau
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

  // Retour à l'accueil : on demande confirmation s'il reste des changements non sauvegardés
  const handleGoHome = () => {
    if (isModified) {
      showModal(t("Warning"), t("You have unsaved changes. Do you really want to leave this page?"), () => navigate("/accueil"));
    } else {
      navigate("/accueil");
    }
  };

  return (
    <div className={styles.container}>
      {/* Barre du haut : retour + titre de la page */}
      <div className={styles.toolbar}>
        <div className={styles.left}>
          <button className="btn" onClick={handleGoHome}>{t("Back to home")}</button>
        </div>
        <h2 className={styles.title}>{isEditing ? t("Edit form") : t("Create form")}</h2>
        <div className={styles.right} />
      </div>

      {/* Titre du formulaire + bouton d'enregistrement */}
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
        {/* Zone où form-js dessine l'éditeur */}
        <div
          ref={editorContainerRef}
          id="form-editor"
          style={{ flex: 1, height: "500px", paddingLeft: "1em", border: "1px solid #ccc", marginTop: "20px", overflow: "hidden" }}
        />

        {/* Panneau de styles personnalisés, à droite de l'éditeur */}
        {stylePanel.visible && (
          <div className={styles.stylePanel}>
            <div className={styles.stylePanelHeader}>
              <span>{t("Custom styles")}</span>
            </div>
            {/* Désactivé tant qu'aucun composant n'est sélectionné */}
            <textarea
              className={styles.stylePanelTextarea}
              value={stylePanel.text}
              onChange={(e) => setStylePanel(p => ({ ...p, text: e.target.value }))}
              rows={10}
              spellCheck={false}
              disabled={!componentSelected}
              placeholder={"background-color: #fdf6e3\nlabel.color: red\nlabel.font-size: 18px\noption.color: blue\noption.font-size: 14px"}
            />
            <button className={styles.stylePanelApply} onClick={handleStylePanelApply} disabled={!componentSelected}>
              {t("Apply")}
            </button>
          </div>
        )}
      </div>

      {/* Modale de confirmation (changements non sauvegardés) */}
      <Modal isOpen={modal.isOpen} title={modal.title} message={modal.message} onClose={closeModal} onConfirm={modal.onConfirm} />
      {/* Notification de succès / erreur */}
      {notification.message && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default FormEditor;