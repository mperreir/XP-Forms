import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Form } from "@bpmn-io/form-js-viewer";

const FormViewer = () => {
  const { id } = useParams(); // Récupération de l'ID du formulaire
  const containerRef = useRef(null);
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFormSchema = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${id}`);
        if (!response.ok) throw new Error("Erreur lors du chargement du formulaire");
        
        const data = await response.json();
        if (!data.json_data || Object.keys(data.json_data).length === 0) {
          throw new Error("Les données du formulaire sont invalides !");
        }

        setSchema(data.json_data); // Stocker le schéma du formulaire
      } catch (error) {
        console.error(error);
        setError(error.message);
      }
    };

    fetchFormSchema();
  }, [id]);

  useEffect(() => {
    if (!schema || !containerRef.current) return;

    const form = new Form({
      container: containerRef.current,
    });

    form
      .importSchema(schema)
      .then(() => console.log("Formulaire chargé avec succès !"))
      .catch((error) => console.error("Erreur d'importation du formulaire :", error));

    form.on("submit", (event) => console.log("Formulaire soumis :", event));
    form.on("changed", (event) => console.log("Changement détecté :", event));

    return () => {
      form.destroy();
    };
  }, [schema]);

  return (
    <div>
      <h2>Form Viewer</h2>
      {error ? (
        <p style={{ color: "red" }}>❌ {error}</p>
      ) : schema ? (
        <div ref={containerRef} id="form" style={{ width: "100%", height: "400px" }}></div>
      ) : (
        <p>Chargement du formulaire...</p>
      )}
      <br />
      <Link to={`/form-editor2/${id}`}>
        <button>Modifier</button>
      </Link>
    </div>
  );
};

export default FormViewer;
