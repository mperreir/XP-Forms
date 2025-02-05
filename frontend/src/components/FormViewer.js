import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const FormViewer = () => {
  const { formId } = useParams(); // Récupère l'ID du formulaire depuis l'URL
  const [form, setForm] = useState(null);

  useEffect(() => {
    // Charge le formulaire depuis localStorage
    const storedForm = localStorage.getItem(`form-${formId}`);
    if (storedForm) {
      setForm(JSON.parse(storedForm));
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
