import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./Merci.css"

const Merci = () => {
  const { t } = useTranslation();
  const body = document.getElementsByTagName('body')[0]; 
  body.style.zoom = '1'; // Remove zoom to center body properly

  return (
    <div 
      id="merci"
      style={{
        textAlign: "center",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <h1>{t('Thank you for your response!')}</h1>
      <p>{t('Press F10 to manually proceed to the next stimulus.')}</p>
    </div>
  );
};

export default Merci;
