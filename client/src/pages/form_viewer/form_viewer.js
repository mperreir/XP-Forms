import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Form } from "@bpmn-io/form-js-viewer";
import Modal from "../../components/Modal";
import styles from './form_viewer.module.css';

const FormViewer = () => {
  const { id, page, id_participant } = useParams();
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

  const dataInitialized = useRef(false);
  const formRef = useRef(null);

const showModal = (title, message, onConfirm = null) => {
  const handleClose = () => {
    setModal({ isOpen: false, title: "", message: "", onConfirm: null });
    if (onConfirm) onConfirm();
  };
  setModal({ isOpen: true, title, message, onConfirm: handleClose });
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
            showModal("Erreur", "Aucun ID utilisateur par défaut enregistré.");
          }
        } catch (error) {
          console.error(error);
          showModal("Erreur", "Impossible de récupérer l'ID utilisateur par défaut.");
        }
      }
    };

    handleParticipantId();
  }, [id_participant, id, page, navigate, location.search]);


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
  if (!schema || !pages[currentPage - 1]) return false;

  const currentComponents = pages[currentPage - 1] || [];

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
  currentFlat.forEach((comp) => {
    // only check components that have a key (skips layout containers)
    if (!comp.key) return;

    if (comp.validate?.required) {
      const value = formData[comp.key];
      if (isEmptyValue(value, comp)) {
        console.debug('Champ requis non rempli sur la page', currentPage, '- key:', comp.key, 'value:', value, 'type:', typeof value, 'comp:', comp);
        isValid = false;
      }
    }
  });

    console.log("Résultat validation page (manual check)", currentPage, ":", isValid, "formData keys:", Object.keys(formData));
  return isValid;
}, [schema, pages, currentPage, formData]);

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
        showModal("Erreur", "Erreur lors du chargement du formulaire");
      }
    };

    fetchFormSchema();
  }, [id]);


  useEffect(() => {
    if (!schema || pages.length === 0) return;
    if (!pages[currentPage - 1]) {
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
        components: pages[currentPage - 1] || [],
      };

      await form.importSchema(pageSchema, loadedData);

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
    if (!schema || pages.length === 0 || !pages[currentPage - 1]) {
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
        <h2>Form Viewer</h2>

        {/* Bouton Retour affiché seulement en mode Admin */}
        {!id_participant && (
          <button className="btn" onClick={handleGoHome}>
            Retour à l'accueil
          </button>
        )}

        {/* Informations sur le formulaire */}
        {!id_participant && formDetails && (
          <div className={styles.formDetails}>
            <p><strong>ID du Formulaire :</strong> {formDetails.id}</p>
            <p><strong>Date de Création :</strong> {new Date(formDetails.created_at).toLocaleString()}</p>
            <p><strong>Pour intégrer dans un scénario Tobii utilisez :</strong> http://localhost:3000/form-viewer/{id}/{page}/id_participant</p>
            <p>Ajoutez <strong>@</strong> comme ID participant pour utiliser l'ID utilisateur par défaut.</p>
            <p>Ajoutez <strong>?navigation=True</strong> à la fin si vous voulez permettre la navigation entre pages.</p>
          </div>
        )}

        {/* Info Participant */}
        {id_participant && (
          <div>
            <p><strong>ID du Participant :</strong> {id_participant}</p>
          </div>
        )}

        {/* Navigation entre pages */}
        {showNavigation && (
          <div className={styles.navigationButtons}>
            <div className={styles.navButtonWrapper}>
              {currentPage > 1 ? (
                <button
                  onClick={() =>
                    navigate(
                      !id_participant
                        ? `/form-viewer/${id}/${currentPage - 1}?navigation=True`
                        : `/form-viewer/${id}/${currentPage - 1}/${id_participant}?navigation=True`
                    )
                  }
                >
                  Page précédente
                </button>
              ) : (
                <div className={styles.placeholder}></div>
              )}
            </div>

            <div className={styles.pageIndicator}>
              Page : {currentPage} / {pages.length}
            </div>

            <div className={styles.navButtonWrapper}>
              {currentPage < pages.length ? (
                <button
                  disabled={isNextPageDisabled}
                  onClick={() => {
                    const ok = validateCurrentPage();
                    console.debug('Next page clicked - validateCurrentPage:', ok, 'page', currentPage, 'formData:', formData);
                    if (!ok) {
                      showModal("Erreur", "Veuillez remplir tous les champs obligatoires avant de passer à la page suivante.");
                      return;
                    }
                    navigate(
                      !id_participant
                        ? `/form-viewer/${id}/${currentPage + 1}?navigation=True`
                        : `/form-viewer/${id}/${currentPage + 1}/${id_participant}?navigation=True`
                    );
                  }}
                >
                Page suivante
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
          <p>Chargement du formulaire...</p>
        )}
      </div>
      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm} // Correctly pass the onConfirm callback
      />
    </>
  );
};

export default FormViewer;
