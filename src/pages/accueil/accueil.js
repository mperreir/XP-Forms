import React from 'react';
import './accueil.css';
import { Link } from "react-router-dom";

const Accueil = () => {

    return (
    <div>
        <h1>Welcome</h1>
        <Link to="/form-editor">Go to Form Editor</Link>
    </div>
    );
};

export default Accueil;