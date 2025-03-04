import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Form } from "@bpmn-io/form-js-viewer";

const FormViewer = () => {
  const { id } = useParams(); // Récupération de l'ID depuis l'URL
  const containerRef = useRef(null);
  const [schema, setSchema] = useState(null);

  useEffect(() => {
    const fetchFormSchema = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/forms/${id}`);
        if (!response.ok) throw new Error("Erreur lors du chargement du formulaire");
        const data = await response.json();
        setSchema(data); // Stocker le schéma du formulaire
      } catch (error) {
        console.error(error);
      }
    };

    fetchFormSchema();
  }, [id]);

  useEffect(() => {
    if (!schema) return;

    const form = new Form({
      container: containerRef.current,
    });

    form
      .importSchema(schema)
      .then(() => {
        console.log("Form imported successfully!");
      })
      .catch((error) => {
        console.error("Error importing form schema:", error);
      });

    form.on("submit", (event) => {
      console.log("Form <submit>", event);
    });

    form.on("changed", 500, (event) => {
      console.log("Form <changed>", event);
    });

    return () => {
      form.destroy();
    };
  }, [schema]);

  return (
    <div>
      <h2>Form Viewer</h2>
      {schema ? (
        <div ref={containerRef} id="form" style={{ width: "100%", height: "400px" }}></div>
      ) : (
        <p>Chargement du formulaire...</p>
      )}
    </div>
  );
};

export default FormViewer;
