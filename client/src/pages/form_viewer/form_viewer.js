import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Form } from "@bpmn-io/form-js-viewer";
import Modal from "../../components/Modal";
import styles from './form_viewer.module.css';
import { useTranslation } from 'react-i18next';
import { STYLE_MAP, STYLE_REFERENCE } from "../../components/Form_components_styles";

const FormViewer = () => {
  const { t } = useTranslation();
  const { id, page, range, id_participant } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = parseInt(page) || 1;
  const queryParams = new URLSearchParams(location.search);
  const showNavigation = queryParams.get("navigation") === "True";

  const containerRef = useRef(null);
  const [schema, setSchema] = useState(null);
  const [pages, setPages] = useState([]);
  const [formDetails, setFormDetails] = useState(null);
  const [componentMapping, setComponentMapping] = useState({});
  const [formData, setFormData] = useState({});
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
  const [isNextPageDisabled, setIsNextPageDisabled] = useState(true);
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [showExtraInfo, setShowExtraInfo] = useState(false);
  const [pageRange, setPageRange] = useState(null);

  const dataInitialized = useRef(false);
  const formRef = useRef(null);

  const showModal = (title, message, onConfirm = null) => {
    const handleClose = () => {
      setModal({ isOpen: false, title: "", message: "", onConfirm: null });
      if (onConfirm) onConfirm();
    };
    setModal({ isOpen: true, title, message, onConfirm: handleClose });
  };

  const showNotification = (message, type = "success", duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => {
        setNotification({ message: "", type: "" });
    }, duration);
  };

  const applyComponentStyles = (component) => {
    if (component.components) component.components.forEach(applyComponentStyles);
    if (!component.styles || Object.keys(component.styles).length === 0) return;

    let targetWrapper = null;

    const input = containerRef.current?.querySelector(`[id$="-${component.id}"]`);
    if (input) targetWrapper = input.closest(".fjs-form-field");

    if (!targetWrapper) {
      const ariaEl = containerRef.current?.querySelector(
        `[aria-labelledby*="${component.id}"], [aria-describedby*="${component.id}"]`
      );
      if (ariaEl) targetWrapper = ariaEl.closest(".fjs-form-field");
    }

    if (!targetWrapper && component.type === "text" && component.text) {
      const cleanText = component.text
        .replace(/#{1,6}\s/g, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/_/g, "")
        .trim().slice(0, 30);
      const candidates = [...(containerRef.current?.querySelectorAll(".fjs-form-field-text") || [])];
      targetWrapper = candidates.find(el =>
        el.textContent.trim().slice(0, 30).includes(cleanText)
      ) || candidates[0];
    }

    if (!targetWrapper) return;

    // Reset
    targetWrapper.removeAttribute("style");
    targetWrapper.querySelectorAll(".fjs-form-field-label, label, legend, h1,h2,h3,h4,h5,h6,p,span,strong,em")
      .forEach(el => el.removeAttribute("style"));

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

    // Styles label.
    if (component.styles.label) {
      const titleLabel = targetWrapper.querySelector(".fjs-form-field-label:not(.fjs-inline-label .fjs-form-field-label)");
      if (titleLabel) {
        Object.entries(component.styles.label).forEach(([property, value]) => {
          if (!value) return;
          titleLabel.style.setProperty(property, value, "important");
        });
      }
    }

    // Styles option.
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

  const goToPage = (p) => {
    const realPage = pageRange ? p + pageRange.start - 1 : p;

    navigate(
      !id_participant
        ? `/form-viewer/${id}/${realPage}${range ? `/${range}` : ""}?navigation=True`
        : `/form-viewer/${id}/${realPage}${range ? `/${range}` : ""}/${id_participant}?navigation=True`
    );
  };

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

  const effectivePages = pageRange ? pages.slice(pageRange.start - 1, pageRange.end) : pages;
  const effectiveCurrentPage = pageRange ? currentPage - pageRange.start + 1 : currentPage;
  const canGoPrev = effectiveCurrentPage > 1;
  const canGoNext = effectiveCurrentPage < effectivePages.length;


  const handleGoHome = () => {
    navigate("/");
  };

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

const validateCurrentPage = useCallback(() => {
  if (!schema || !effectivePages[effectiveCurrentPage - 1]) return false;

  const currentComponents = effectivePages[effectiveCurrentPage - 1] || [];

  // flatten nested components in the page (useful if components contain child components)
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
    const currentKeys = currentFlat.map(c => c.key).filter(Boolean);
    // If the form instance is available, prefer using its validation
    if (formRef.current) {
      const errors = formRef.current.validate();
      // If any error key belongs to current page, page is not valid
      const errorKeys = Object.keys(errors);
      // currentKeys are component keys (e.g. select_92cfpb), but form.validate may return ids (e.g. Field_1a6wxb4)
      const currentIds = currentFlat.map(c => c.id).filter(Boolean);
      const hasErrorOnPage = errorKeys.some((k) => currentKeys.includes(k) || currentIds.includes(k));
      isValid = !hasErrorOnPage;
      if (!isValid) {
        console.debug('Validation via form.validate found errors on page. Errors:', errors);
      }
      console.log("Résultat validation page (via form.validate)", currentPage, ":", isValid, "errorKeys:", errorKeys, "currentIds:", currentIds, "currentKeys:", currentKeys);
      return isValid;
    }

    console.log("Résultat validation page (manual check)", currentPage, ":", isValid, "formData keys:", Object.keys(formData));
  return isValid;
}, [schema, effectivePages, effectiveCurrentPage, formData]);

  useEffect(() => {
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

        if (!data || !data.json_data || !Array.isArray(data.json_data.components)) {
          throw new Error("Le schéma du formulaire est invalide ou vide.");
        }

        setSchema(data.json_data);
        setFormDetails(data);

        const paginated = splitSchemaBySeparator(data.json_data.components);
        setPages(paginated);

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


  useEffect(() => {
    if (!schema || effectivePages.length === 0) return;
    if (!effectivePages[effectiveCurrentPage - 1]) {
      console.error("Page invalide");
      return;
    }

    const form = new Form({
      container: containerRef.current,
    });
    formRef.current = form;

    const loadAndRender = async () => {
      let loadedData = {};
      if (id_participant) {
        loadedData = await fetchSavedData();
        setFormData(loadedData);
      }

      const pageSchema = {
        ...schema,
        components: effectivePages[effectiveCurrentPage - 1] || [],
      };

      await form.importSchema(pageSchema, loadedData);

      let stylesApplied = false;

      const applyOnce = () => {
        if (stylesApplied) return;
        stylesApplied = true;
        pageSchema.components.forEach(applyComponentStyles);
      };

      // Tentative après rendu initial
      applyOnce();

      dataInitialized.current = true;

      form.on("submit", (event) => {
        const errors = form.validate();

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

      form.on("changed", (event) => {
        if (!dataInitialized.current) return;

        const newData = event.data;
        console.debug('Form changed:', newData);

        Object.entries(newData).forEach(([key, value]) => {
          setFormData((prevData) => {
            if (prevData[key] === value) {
              return prevData;
            }

            const updated = { ...prevData, [key]: value };

            // Save to backend only when a participant is present.
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

    return () => {
      formRef.current = null;
      form.destroy();
    };
  }, [schema, pages, currentPage, componentMapping, id_participant, navigate, fetchSavedData, id]);

  // Recalculer la validité de la page courante à chaque changement de formData
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

              {id_participant && (
                <div className={styles.participantTooltip}>
                  {t("Participant ID:")} {id_participant}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Informations sur le formulaire */}
       {!id_participant && formDetails && (
        <div className={styles.formDetails}>
          <div className={styles.adminInfoWrapper}>
            <p className={styles.info}><strong>{t("Form ID:")}</strong> {formDetails.id}</p>
            <p className={styles.info}><strong>{t("Creation date :")}</strong> {new Date(formDetails.created_at).toLocaleString()}</p>
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
        {showNavigation && (
          <div className={styles.navigationButtons}>
            <div className={styles.navButtonWrapper}>
              {canGoPrev ? (
                <button onClick={() => goToPage(effectiveCurrentPage - 1)}>
                  {t("Previous page")}
                </button>
              ) : (
                <div className={styles.placeholder}></div>
              )}
            </div>

            <div className={styles.navButtonWrapper}>
              {canGoNext ? (
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
        {schema ? (
          <div ref={containerRef} id="form" style={{ width: "100%" }}></div>
        ) : (
          <p>{t("Loading form...")}</p>
        )}
      </div>
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm} // Correctly pass the onConfirm callback
      />
      {notification.message && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
            {notification.message}
        </div>
      )}
    </>
  );
};

export default FormViewer;
