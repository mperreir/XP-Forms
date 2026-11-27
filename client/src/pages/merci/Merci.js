import React from "react";
import { useTranslation } from "react-i18next";

// Page de remerciement, affichée après l'envoi d'un formulaire (route /merci)
const Merci = () => {
  const { t } = useTranslation();
  // On modifie directement le <body> pour remettre le zoom à 1
  const body = document.getElementsByTagName("body")[0];
  body.style.zoom = "1"; // Remove zoom to center body properly

  return (
    // Contenu centré horizontalement et verticalement sur toute la hauteur de l'écran
    <div
      id="merci"
      style={
        { textAlign: "center", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }
      }
    >
      <h1>{t("Thank you for your response!")}</h1>
      {/* Consigne pour passer manuellement au stimulus suivant (probablement dans un scénario Tobii) */}
      <p>{t("Please press the F10 key to manually proceed to the next stimulus.")}</p>
    </div>
  );
};

export default Merci;