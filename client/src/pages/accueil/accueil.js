import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import './accueil.css';

const Accueil = () => {
    const [forms, setForms] = useState([]);

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/forms');
                if (!response.ok) throw new Error('Erreur lors du chargement des formulaires');
                const data = await response.json();
                setForms(data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchForms();
    }, []);

    return (
        <div>
            <h1>Accueil</h1>
            <Link to="/form-editor2">Créer un nouveau formulaire</Link>

            <h2>Liste des formulaires enregistrés</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Titre</th>
                        <th>Date de création</th>
                        <th>Dernière mise à jour</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {forms.length > 0 ? (
                        forms.map(form => (
                            <tr key={form.id}>
                                <td>{form.id}</td>
                                <td>{form.title}</td>
                                <td>{new Date(form.created_at).toLocaleString()}</td>
                                <td>{new Date(form.updated_at).toLocaleString()}</td>
                                <td>
                                    <Link to={`/form-viewer/${form.id}`}>
                                        <button>Voir</button>
                                    </Link>
                                </td>
                                <td>
                                    <Link to={`/form-editor2/${form.id}`}>
                                        <button>Modifier</button>
                                    </Link>
                                </td>

                                <td>
                                    <Link to={`/form-responses/${form.id}`}>
                                        <button>Voir Réponses</button>
                                    </Link>
                                </td>

                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5">Aucun formulaire trouvé</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Accueil;