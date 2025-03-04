import React, { useEffect, useRef, useState } from "react";
import { Playground } from "@bpmn-io/form-js-playground";

const FormEditor = () => {
  const containerRef = useRef(null);
  const playgroundRef = useRef(null);
  const [schemaData, setSchemaData] = useState(null);

  useEffect(() => {
    if (containerRef.current && !playgroundRef.current) {
      const schema = {
        type: "default",
        components: [
          {
            key: "creditor",
            label: "Creditor",
            type: "textfield",
            validate: { required: true },
          },
        ],
      };

      const data = {
        creditor: "John Doe Company",
      };

      try {
        // Initialiser Playground et attendre l'initialisation complète
        playgroundRef.current = new Playground({
          container: containerRef.current,
          schema,
          data,
        });

        // Utiliser un délai pour garantir que Playground est bien prêt
        const checkPlaygroundReady = setInterval(() => {
          if (playgroundRef.current) {
            try {
              const { schema: newSchema, data: newData } = playgroundRef.current.getState();
              setSchemaData({ schema: newSchema, data: newData });
              clearInterval(checkPlaygroundReady); // Stopper l'intervalle une fois que Playground est prêt
            } catch (error) {
              console.warn("Playground not ready yet, retrying...");
            }
          }
        }, 100); // Vérifie toutes les 100ms
      } catch (error) {
        console.error("Error initializing Playground:", error);
      }
    }
  }, []);

  return (
    <div>
      <h2>Form Editor</h2>
      <div ref={containerRef} id="container" style={{ width: "100%", height: "500px" }}></div>
      {schemaData && (
        <pre style={{ background: "#eee", padding: "10px" }}>
          {JSON.stringify(schemaData, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default FormEditor;
