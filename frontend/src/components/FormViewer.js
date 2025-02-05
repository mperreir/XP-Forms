import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const FormViewer = () => {
  const { formId } = useParams(); // Récupère l'ID du formulaire depuis l'URL
  const [form, setForm] = useState(null);

  useEffect(() => {
    // Vérifier si des formulaires existent
    const storedForms = JSON.parse(localStorage.getItem("forms")) || [];
    
    // Rechercher le formulaire correspondant à l'ID dans la liste
    const foundForm = storedForms.find((form) => form.id === formId);

    if (foundForm) {
      setForm(foundForm);
    }
  }, [formId]);

  if (!form) {
    return <p>Formulaire introuvable</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>{form.title}</h1>
      <form>
        {form.questions.map((question, index) => (
          <div key={index}>
            <label>{question}</label>
            <input type="text" />
          </div>
        ))}
      </form>
    </div>
  );
};

export default FormViewer;
