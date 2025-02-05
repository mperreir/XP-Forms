import React, { useState, useEffect } from "react";

const FormList = () => {
  const [forms, setForms] = useState([]);

  useEffect(() => {
    const storedForms = JSON.parse(localStorage.getItem("forms")) || [];
    setForms(storedForms);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Formulaires créés</h1>
      {forms.length > 0 ? (
        <ul>
          {forms.map((form) => (
            <li key={form.id}>
              <strong>{form.title}</strong> - <a href={form.url}>{form.url}</a>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun formulaire n’a été créé.</p>
      )}
    </div>
  );
};

export default FormList;
