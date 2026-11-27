import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Form } from "@bpmn-io/form-js-viewer";
import Modal from "../../components/Modal";
import styles from './form_viewer.module.css';
import { useTranslation } from 'react-i18next';

// Page d'affichage d'un formulaire : page par page, avec sauvegarde automatique
// des réponses d'un participant et navigation optionnelle entre les pages
const FormViewer = () => {
  const { t } = useTranslation();
  // Paramètres de l'URL : formulaire, page, plage de pages (ex. "2-4") et participant
  const { id, page, range, id_participant } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = parseInt(page) || 1;
  // ?navigation=True : affiche les boutons Précédent / Suivant
  const queryParams = new URLSearchParams(location.search);
  const showNavigation = queryParams.get("navigation") === "True";

  const containerRef = useRef(null); // div dans laquelle form-js affiche le formulaire
  const [schema, setSchema] = useState(null); // schéma complet du formulaire
  const [pages, setPages] = useState([]); // composants découpés en pages
  const [formDetails, setFormDetails] = useState(null); // infos du formulaire (id, date...)
  const [componentMapping, setComponentMapping] = useState({}); // clé du composant -> id du composant
  const [formData, setFormData] = useState({}); // réponses actuellement saisies
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const [isNextPageDisabled, setIsNextPageDisabled] = useState(true); // bouton "Page suivante" grisé ?
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [showExtraInfo, setShowExtraInfo] = useState(false); // petit menu d'aide pour l'admin
  const [pageRange, setPageRange] = useState(null); // plage de pages autorisée, ex. { start: 2, end: 4 }

  // Passe à true une fois les réponses chargées (évite de les re-sauvegarder au chargement)
  const dataInitialized = useRef(false);
  const formRef = useRef(null); // instance form-js en cours

  // Ouvre la modale ; au clic sur le bouton, on la ferme puis on exécute l'action demandée
  const showModal = (title, message, onConfirm = null) => {
    const handleClose = () => {
      setModal({ isOpen: false, title: "", message: "", onConfirm: null });
      if (onConfirm) onConfirm();
    };
    setModal({ isOpen: true, title, message, onConfirm: handleClose });
  };

  // Notification temporaire qui disparaît après "duration" ms
  const showNotification = (message, type = "success", duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
        setNotification({ message: "", type: "" });
    }, duration);
  };

  // Applique les styles personnalisés (définis dans l'éditeur) sur les champs affichés.
  // Même principe que dans l'éditeur, mais ici il faut d'abord retrouver l'élément HTML du champ
  const applyComponentStyles = (component) => {
    // On commence par les enfants
    if (component.components) component.components.forEach(applyComponentStyles);
    if (!component.styles || Object.keys(component.styles).length === 0) return;

    let targetWrapper = null;

    // Méthode 1 : on cherche un élément dont l'id finit par l'id du composant
    const input = containerRef.current?.querySelector(`[id$="-${component.id}"]`);
    if (input) targetWrapper = input.closest(".fjs-form-field");

    // Méthode 2 : on passe par les attributs aria (labelledby / describedby)
    if (!targetWrapper) {
      const ariaEl = containerRef.current?.querySelector(
        `[aria-labelledby*="${component.id}"], [aria-describedby*="${component.id}"]`
      );
      if (ariaEl) targetWrapper = ariaEl.closest(".fjs-form-field");
    }

    // Méthode 3 (blocs de texte) : on compare le début du texte pour retrouver le bon bloc
    if (!targetWrapper && component.type === "text" && component.text) {
      // On enlève la syntaxe markdown pour comparer du texte brut
      const cleanText = component.text
        .replace(/#{1,6}\s/g, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/_/g, "")
        .trim().slice(0, 30);
      const candidates = [...(containerRef.current?.querySelectorAll(".fjs-form-field-text") || [])];
      targetWrapper = candidates.find(el =>
        el.textContent.trim().slice(0, 30).includes(cleanText)
      ) || candidates[0];
    }

    // Élément introuvable : on abandonne
    if (!targetWrapper) return;

    // Reset : on enlève les anciens styles avant de réappliquer
    targetWrapper.removeAttribute("style");
    targetWrapper.querySelectorAll(".fjs-form-field-label, label, legend, h1,h2,h3,h4,h5,h6,p,span,strong,em")
      .forEach(el => el.removeAttribute("style"));

    // Propriétés de texte qu'on propage aussi aux éléments à l'intérieur du champ
    const typographyProps = ["color", "font-size", "font-weight", "font-style", "text-decoration", "text-align", "font-family", "line-height", "letter-spacing"];

    // Styles du wrapper
    Object.entries(component.styles).forEach(([property, value]) => {
      if (property === "label" || property === "option") return;
      if (!value) return;
      targetWrapper.style.setProperty(property, value, "important");
      if (typographyProps.includes(property)) {
        targetWrapper.querySelectorAll(".fjs-form-field-label, label, legend, h1,h2,h3,h4,h5,h6,p,span,strong,em")
          .forEach(el => el.style.setProperty(property, value, "important"));
      }
    });

    // Styles label. : uniquement le titre du champ
    if (component.styles.label) {
      const titleLabel = targetWrapper.querySelector(".fjs-form-field-label:not(.fjs-inline-label .fjs-form-field-label)");
      if (titleLabel) {
        Object.entries(component.styles.label).forEach(([property, value]) => {
          if (!value) return;
          titleLabel.style.setProperty(property, value, "important");
        });
      }
    }

    // Styles option. : uniquement les libellés des options
    if (component.styles.option) {
      const optionLabels = [...targetWrapper.querySelectorAll(".fjs-inline-label .fjs-form-field-label")];
      Object.entries(component.styles.option).forEach(([property, value]) => {
        if (!value) return;
        optionLabels.forEach(el => el.style.setProperty(property, value, "important"));
      });
    }

    // Empêche l'héritage sur les inputs
    targetWrapper.querySelectorAll("input, select, textarea").forEach(el => {
      el.style.setProperty("text-decoration", "none", "important");
      el.style.setProperty("font-weight", "normal", "important");
      el.style.setProperty("font-style", "normal", "important");
      el.style.setProperty("color", "initial", "important");
      el.style.setProperty("font-size", "initial", "important");
    });
  };

  // 👉 Vérification si @ est dans l'URL
  // Si l'id participant est "@", on le remplace par l'id participant par défaut enregistré côté serveur
  useEffect(() => {
    const handleParticipantId = async () => {
      if (id_participant === '@') {
        // Cas 1 : @ --> Aller chercher l'id par défaut
        try {
          const response = await fetch('/api/default-user-id');
          if (!response.ok) throw new Error("Erreur lors de la récupération de l'ID utilisateur par défaut.");

          const data = await response.json();
          const defaultUserId = data.defaultUserId;

          if (defaultUserId) {
            // On remplace l'URL (replace: true évite de polluer l'historique)
            const newPath = `/form-viewer/${id}/${page}/${defaultUserId}${location.search}`;
            navigate(newPath, { replace: true });
          } else {
            showNotification("Aucun ID utilisateur par défaut enregistré.", "error");
          }
        } catch (error) {
          console.error(error);
          showNotification("Impossible de récupérer l'ID utilisateur par défaut.", "error");
        }
      }
    };

    handleParticipantId();
  }, [id_participant, id, page, navigate, location.search]);

  // Lit la plage de pages dans l'URL (format "début-fin", ex. "2-4") et vérifie qu'elle est valide
  useEffect(() => {
    if (!range) {
      setPageRange(null);
      return;
    }

    const match = range.match(/^(\d+)-(\d+)$/);
    if (!match) {
      console.warn("Range invalide :", range);
      setPageRange(null);
      return;
    }

    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);

    if (start <= 0 || end < start) {
      console.warn("Range incohérent :", range);
      setPageRange(null);
      return;
    }

    setPageRange({ start, end });
  }, [range]);

  // Si la page demandée est en dehors de la plage, on revient à la première page de la plage
  useEffect(() => {
    if (!pageRange) return;

    if (currentPage < pageRange.start || currentPage > pageRange.end) {
      const safePage = pageRange.start;
      navigate(
        !id_participant
          ? `/form-viewer/${id}/${safePage}/${range}?navigation=True`
          : `/form-viewer/${id}/${safePage}/${range}/${id_participant}?navigation=True`,
        { replace: true }
      );
    }
  }, [currentPage, pageRange, id, id_participant, navigate, range])

  // Change de page en modifiant l'URL (en tenant compte de la plage et du participant)
  const goToPage = (p) => {
    const realPage = pageRange ? p + pageRange.start - 1 : p;

    navigate(
      !id_participant
        ? `/form-viewer/${id}/${realPage}${range ? `/${range}` : ""}?navigation=True`
        : `/form-viewer/${id}/${realPage}${range ? `/${range}` : ""}/${id_participant}?navigation=True`
    );
  };

  // Découpe la liste des composants en pages : chaque "séparateur" ouvre une nouvelle page
  const splitSchemaBySeparator = (components) => {
    const pages = [[]];
    components.forEach((comp) => {
      if (comp.type === "separator") {
        pages.push([]);
      } else {
        pages[pages.length - 1].push(comp);
      }
    });
    return pages;
  };

  // Pages réellement accessibles (toutes, ou seulement celles de la plage)
  const effectivePages = pageRange ? pages.slice(pageRange.start - 1, pageRange.end) : pages;
  // Numéro de la page courante par rapport à la plage (la plage commence à 1)
  const effectiveCurrentPage = pageRange ? currentPage - pageRange.start + 1 : currentPage;
  const canGoPrev = effectiveCurrentPage > 1;
  const canGoNext = effectiveCurrentPage < effectivePages.length;


  const handleGoHome = () => {
    navigate("/");
  };

  // Récupère les réponses déjà enregistrées pour ce participant : { clé du composant: valeur }
  const fetchSavedData = useCallback(async () => {
    try {
      const response = await fetch(`/api/form-responses-participant/${id}/${id_participant}`);
      if (!response.ok) throw new Error("Erreur lors du chargement des réponses sauvegardées");
      const data = await response.json();

      const loadedData = {};
      data.responses.forEach((item) => {
        loadedData[item.component_key] = item.value;
      });

      return loadedData;
    } catch (error) {
      console.error("Erreur de récupération des données:", error);
      return {};
    }
  }, [id, id_participant]);

// Vérifie si la page courante est valide (champs obligatoires remplis...).
// Le résultat sert à activer ou griser le bouton "Page suivante"
const validateCurrentPage = useCallback(() => {
  if (!schema || !effectivePages[effectiveCurrentPage - 1]) return false;

  const currentComponents = effectivePages[effectiveCurrentPage - 1] || [];

  // flatten nested components in the page (useful if components contain child components)
  // Met tous les composants à plat (y compris ceux dans des groupes)
  const flatten = (components) => {
    const flat = [];
    components.forEach((c) => {
      flat.push(c);
      if (Array.isArray(c.components) && c.components.length > 0) {
        flat.push(...flatten(c.components));
      }
    });
    return flat;
  };

  // (Fonction non utilisée par la suite : la validation passe en réalité par `form.validate()`, plus bas)
  const isEmptyValue = (value, comp) => {
    // undefined or null -> empty
    if (value === undefined || value === null) return true;

    // strings -> trim and check
    if (typeof value === 'string' && value.trim() === '') return true;

    // arrays -> empty if zero length
    if (Array.isArray(value) && value.length === 0) return true;

    // plain objects -> empty if no keys
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return true;

    // booleans -> for required fields, boolean 'true' is expected / false is considered empty/incomplete
    if (typeof value === 'boolean') return value !== true;

    // numbers -> 0 is allowed
    return false;
  };

  const currentFlat = flatten(currentComponents);
  let isValid = true;
    // Clés des composants de la page (pour savoir à quels champs appartiennent les erreurs)
    const currentKeys = currentFlat.map(c => c.key).filter(Boolean);
    // If the form instance is available, prefer using its validation
    // Si form-js est disponible, on utilise sa propre validation
    if (formRef.current) {
      const errors = formRef.current.validate();
      // If any error key belongs to current page, page is not valid
      const errorKeys = Object.keys(errors);
      // currentKeys are component keys (e.g. select_92cfpb), but form.validate may return ids (e.g. Field_1a6wxb4)
      // form.validate peut renvoyer des ids ou des clés : on compare avec les deux
      const currentIds = currentFlat.map(c => c.id).filter(Boolean);
      // La page est invalide si au moins une erreur concerne l'un de ses champs
      const hasErrorOnPage = errorKeys.some((k) => currentKeys.includes(k) || currentIds.includes(k));
      isValid = !hasErrorOnPage;
      if (!isValid) {
        console.debug('Validation via form.validate found errors on page. Errors:', errors);
      }
      console.log("Résultat validation page (via form.validate)", currentPage, ":", isValid, "errorKeys:", errorKeys, "currentIds:", currentIds, "currentKeys:", currentKeys);
      return isValid;
    }

    // Pas d'instance du formulaire : on considère la page valide
    console.log("Résultat validation page (manual check)", currentPage, ":", isValid, "formData keys:", Object.keys(formData));
  return isValid;
}, [schema, effectivePages, effectiveCurrentPage, formData]);

  // Chargement du schéma du formulaire depuis l'API (à l'ouverture, ou si l'id change)
  useEffect(() => {
    // Met tous les composants à plat, y compris ceux imbriqués dans des groupes
    const flattenComponents = (components) => {
      const flat = [];

      components.forEach((component) => {
        flat.push(component);
        if (Array.isArray(component.components) && component.components.length > 0) {
          flat.push(...flattenComponents(component.components));
        }
      });

      return flat;
    };

    const fetchFormSchema = async () => {
      try {
        const response = await fetch(`/api/forms/${id}`);
        if (!response.ok) throw new Error("Erreur lors du chargement du formulaire");
        const data = await response.json();

        // On vérifie que le schéma est exploitable
        if (!data || !data.json_data || !Array.isArray(data.json_data.components)) {
          throw new Error("Le schéma du formulaire est invalide ou vide.");
        }

        setSchema(data.json_data);
        setFormDetails(data);

        // Découpage en pages grâce aux séparateurs
        const paginated = splitSchemaBySeparator(data.json_data.components);
        setPages(paginated);

        // Table de correspondance clé -> id, utilisée pour sauvegarder les réponses
        const allComponents = flattenComponents(data.json_data.components);
        const mapping = {};
        allComponents.forEach((component) => {
          if (component.key) {
            mapping[component.key] = component.id;
          }
        });
        setComponentMapping(mapping);

      } catch (error) {
        console.error("Erreur lors du chargement du schéma du formulaire:", error);
        showNotification("Erreur lors du chargement du formulaire", "error");
      }
    };

    fetchFormSchema();
  }, [id]);


  // Affichage de la page courante : on (re)crée le formulaire à chaque changement de page
  useEffect(() => {
    if (!schema || effectivePages.length === 0) return;
    if (!effectivePages[effectiveCurrentPage - 1]) {
      console.error("Page invalide");
      return;
    }

    // Nouvelle instance form-js pour cette page
    const form = new Form({
      container: containerRef.current,
    });
    formRef.current = form;

    const loadAndRender = async () => {
      // Si un participant est connu, on recharge ses réponses déjà enregistrées
      let loadedData = {};
      if (id_participant) {
        loadedData = await fetchSavedData();
        setFormData(loadedData);
      }

      // Schéma ne contenant que les composants de la page courante
      const pageSchema = {
        ...schema,
        components: effectivePages[effectiveCurrentPage - 1] || [],
      };

      await form.importSchema(pageSchema, loadedData);

      let stylesApplied = false;

      // Applique les styles personnalisés une seule fois après le rendu
      const applyOnce = () => {
        if (stylesApplied) return;
        stylesApplied = true;
        pageSchema.components.forEach(applyComponentStyles);
      };

      // Tentative après rendu initial
      applyOnce();

      // À partir de là, les changements viennent de l'utilisateur (et non du chargement)
      dataInitialized.current = true;

      // Soumission du formulaire (dernier bouton)
      form.on("submit", (event) => {
        const errors = form.validate();

        // S'il reste des erreurs, on ne valide pas
        if (Object.keys(errors).length) {
          console.error('Form has errors', errors);
          return;
        }

        event.preventDefault();
        showModal(
          "Validation",
          "Votre formulaire a été soumis avec succès.",
          () => navigate("/merci") // Redirect to the "Merci" page when "Fermer" is pressed
        );
      });

      // À chaque modification d'un champ : on met à jour l'état et on sauvegarde la réponse
      form.on("changed", (event) => {
        if (!dataInitialized.current) return;

        const newData = event.data;
        console.debug('Form changed:', newData);

        Object.entries(newData).forEach(([key, value]) => {
          setFormData((prevData) => {
            // Valeur inchangée : rien à faire
            if (prevData[key] === value) {
              return prevData;
            }

            const updated = { ...prevData, [key]: value };

            // Save to backend only when a participant is present.
            // On n'enregistre que si on connaît le participant
            const component_id = componentMapping[key];
            if (id_participant && component_id) {
              fetch("/api/save-response", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  form_id: id,
                  user_id: id_participant,
                  component_id,
                  value,
                }),
              })
                .then((response) => response.json())
                .then((data) => {
                  console.log("Réponse sauvegardée :", data);
                })
                .catch((error) => {
                  console.error("Erreur lors de la sauvegarde :", error);
                });
            }

            return updated;
          });
        });
      });
    };

    loadAndRender();

    // Nettoyage : on détruit le formulaire quand on change de page ou qu'on quitte
    return () => {
      formRef.current = null;
      form.destroy();
    };
  }, [schema, pages, currentPage, componentMapping, id_participant, navigate, fetchSavedData, id]);

  // Recalculer la validité de la page courante à chaque changement de formData
  // (sert à activer ou griser le bouton "Page suivante")
  useEffect(() => {
    if (!schema || effectivePages.length === 0 || !pages[currentPage - 1]) {
      setIsNextPageDisabled(true);
      return;
    }
    // Petit délai pour s'assurer que le Form est rendu
    const timeoutId = setTimeout(() => {
      const isValid = validateCurrentPage();
      setIsNextPageDisabled(!isValid);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [formData, currentPage, schema, pages, validateCurrentPage]);

  return (
    <>
      <div className={styles.formViewerContainer}>
        {/* Barre du haut : retour, titre, numéro de page et participant */}
        <div className={styles.toolbar}>
          {/* Bouton Retour affiché seulement en mode Admin */}
          <div className={styles.left}>
            {!id_participant && (
              <button className="btn" onClick={handleGoHome}>
                {t("Back to home")}
              </button>
            )}
          </div>
          <h2 className={styles.title}>{t("Form Viewer")}</h2>
          <div className={styles.right}>
            <div className={styles.pageWrapper}>
              <span className={styles.pageIndicator}>
                {t("Page:")} {effectiveCurrentPage} / {effectivePages.length}
              </span>

              {/* Rappel de l'id du participant (affiché au survol) */}
              {id_participant && (
                <div className={styles.participantTooltip}>
                  {t("Participant ID:")} {id_participant}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Informations sur le formulaire */}
        {/* Visibles uniquement en mode admin (sans participant) */}
       {!id_participant && formDetails && (
        <div className={styles.formDetails}>
          <div className={styles.adminInfoWrapper}>
            <p className={styles.info}><strong>{t("Form ID:")}</strong> {formDetails.id}</p>
            <p className={styles.info}><strong>{t("Creation date :")}</strong> {new Date(formDetails.created_at).toLocaleString()}</p>
            {/* Bouton + / − pour déplier l'aide sur la construction de l'URL */}
            <div
              className={styles.toggleExtraInfo}
              onClick={() => setShowExtraInfo(prev => !prev)}
              title={t("Form information")}
            >
              {showExtraInfo ? "−" : "+"}
            </div>

            {showExtraInfo && (
              <div className={styles.adminDropdown}>
                <p>
                  <strong>{t("To integrate in a Tobii scenario use:")}</strong><br />
                  http://localhost:3000/form-viewer/{id}/{page}/id_participant
                </p>
                <p>
                  {t("Add @ as participant ID to use the default user ID.")}
                </p>
                <p>
                  {t("Add /start-end between the page number and the participant ID to browse a range of pages. Example:")} <strong>/2-4/id</strong>
                </p>
                <p>
                  {t("Add ?navigation=True at the end if you want to allow navigation between pages.")}
                </p>            </div>
            )}
            </div>
          </div>
      )}
        {/* Navigation entre pages */}
        {/* Affichée seulement si l'URL contient ?navigation=True */}
        {showNavigation && (
          <div className={styles.navigationButtons}>
            <div className={styles.navButtonWrapper}>
              {canGoPrev ? (
                <button onClick={() => goToPage(effectiveCurrentPage - 1)}>
                  {t("Previous page")}
                </button>
              ) : (
                // Espace vide pour garder les boutons alignés
                <div className={styles.placeholder}></div>
              )}
            </div>

            <div className={styles.navButtonWrapper}>
              {canGoNext ? (
                // Grisé tant que la page courante n'est pas valide
                <button
                  disabled={isNextPageDisabled}
                  onClick={() => goToPage(effectiveCurrentPage + 1)}
                >
                  {t("Next page")}
                </button>
              ) : (
                <div className={styles.placeholder}></div>
              )}
            </div>
          </div>
        )}

        {/* Formulaire affiché */}
        {/* Le conteneur où form-js dessine la page courante */}
        {schema ? (
          <div ref={containerRef} id="form" style={{ width: "100%" }}></div>
        ) : (
          <p>{t("Loading form...")}</p>
        )}
      </div>
      {/* Modale affichée après la soumission du formulaire */}
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm} // Correctly pass the onConfirm callback
      />
      {/* Notification de succès / erreur */}
      {notification.message && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.message}
        </div>
      )}
    </>
  );
};

export default FormViewer;