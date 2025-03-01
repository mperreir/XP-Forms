import React, { useEffect, useRef } from "react";
import { Form } from "@bpmn-io/form-js-viewer";

const FormViewer = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const schema = {   /* A remplacer par le schema (json) du form à afficher (sera fait dynamiquement dans le futur) */
      components: [
        {
          label: "Nom",
          type: "textfield",
          layout: { row: "Row_174h0nq", columns: null },
          id: "Field_0un3mya",
          key: "textfield_rpxqap",
        },
        {
          label: "Description",
          type: "textarea",
          layout: { row: "Row_1wgt5rh", columns: null },
          id: "Field_1eew14r",
          key: "textarea_0qd5ti",
        },
        {
          subtype: "date",
          dateLabel: "Date de naissance",
          type: "datetime",
          layout: { row: "Row_1o8qs9o", columns: null },
          id: "Field_0jxg4km",
          key: "datetime_5r5lsj",
        },
        {
          label: "Num téléphone",
          type: "number",
          layout: { row: "Row_1o8qs9o", columns: null },
          id: "Field_08l3c1o",
          key: "number_snc0f",
        },
        {
          label: "Ville",
          values: [
            { label: "Nantes", value: "nantes" },
            { label: "Paris", value: "paris" },
          ],
          type: "select",
          layout: { row: "Row_0wetp5q", columns: null },
          id: "Field_1ye0yxm",
          key: "select_56qu6e",
        },
        {
          label: "Sport",
          values: [
            { label: "Football", value: "football" },
            { label: "Basketball", value: "basketball" },
          ],
          type: "radio",
          layout: { row: "Row_10ainsa", columns: null },
          id: "Field_132fixh",
          key: "radio_3lqjk",
        },
      ],
      type: "default",
      id: "Form_04mzcyf",
      exporter: {
        name: "form-js (https://demo.bpmn.io)",
        version: "1.14.0",
      },
      schemaVersion: 18,
    };

    const form = new Form({
      container: containerRef.current, // Utilisation d'un ref pour éviter querySelector
    });

    form
      .importSchema(schema)
      .then(() => {
        console.log("Form imported successfully!");
      })
      .catch((error) => {
        console.error("Error importing form schema:", error);
      });

    // Ajouter les événements
    form.on("submit", (event) => {
      console.log("Form <submit>", event);
    });

    form.on("changed", 500, (event) => {
      console.log("Form <changed>", event);
    });

    return () => {
      form.destroy(); // Nettoyer pour éviter les fuites mémoire
    };
  }, []);

  return (
    <div>
      <h2>Form Viewer</h2>
      <div ref={containerRef} id="form" style={{ width: "100%", height: "400px" }}></div>
    </div>
  );
};

export default FormViewer;
