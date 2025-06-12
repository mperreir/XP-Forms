import React, { useEffect, useRef, useState } from "react";
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

  const dataInitialized = useRef(false);

  const showModal = (title, message, onConfirm = null) => {
    setModal({ isOpen: true, title, message, onConfirm });
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

  const fetchSavedData = async () => {
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
  };

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
        if (!id_participant || !dataInitialized.current) return;

        const newData = event.data;
        Object.entries(newData).forEach(([key, value]) => {
          if (formData[key] !== value) {
            setFormData((prevData) => ({
              ...prevData,
              [key]: value,
            }));

            const component_id = componentMapping[key];
            if (!component_id) return;

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
        });
      });
    };

    loadAndRender();

    return () => {
      form.destroy();
    };
  }, [schema, pages, currentPage, componentMapping, id_participant, navigate]);

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
                  onClick={() =>
                    navigate(
                      !id_participant
                        ? `/form-viewer/${id}/${currentPage + 1}?navigation=True`
                        : `/form-viewer/${id}/${currentPage + 1}/${id_participant}?navigation=True`
                    )
                  }
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
