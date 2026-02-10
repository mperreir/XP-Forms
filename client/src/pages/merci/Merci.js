import React from "react";
import { useTranslation } from "react-i18next";
import "./Merci.css";

const Merci = () => {
  const { t } = useTranslation();
  React.useEffect(() => {
    const body = document.getElementsByTagName('body')[0];
    body.style.zoom = '1';
  }, []);

  return (
    <div id="merci">
      <h1>{t('Thank you for your response!')}</h1>
      <p>{t('Press F10 to manually proceed to the next stimulus.')}</p>
    </div>
  );
};

export default Merci;
