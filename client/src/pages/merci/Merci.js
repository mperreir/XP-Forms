import React from "react";
import styles from "./Merci.css"

const Merci = () => {
  const body = document.getElementsByTagName('body')[0]; 
  body.style.zoom = '1'; // Remove zoom to center body properly

  return (
    <div 
      id="merci"
      style={
        { textAlign: "center", 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center" }
        }
    >
      <h1>Merci pour votre réponse !</h1>
      <p>Veuillez appuyer sur la touche F10 pour passer manuellement au stimulus suivant.</p>
    </div>
  );
};

export default Merci;
