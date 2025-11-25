import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import styles from './accueil.module.css'; // Import CSS Module
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";

const Accueil = () => {
    const [forms, setForms] = useState([]);
    const [newUserId, setNewUserId] = useState(localStorage.getItem('defaultUserId') || ""); // Utiliser la valeur du localStorage ou une valeur vide
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
    const navigate = useNavigate(); // Permet de gérer la navigation

    const showModal = (title, message, onConfirm = null) => {
        setModal({ isOpen: true, title, message, onConfirm });
    };

    const closeModal = () => {
        setModal({ isOpen: false, title: "", message: "", onConfirm: null });
    };

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await fetch('/api/forms');
                if (!response.ok) throw new Error('Erreur lors du chargement des formulaires');
                const data = await response.json();
                const formsWithCounts = await Promise.all(
                data.map(async (form) => {
                    try {
                        const res = await fetch(`/api/forms/${form.id}/responses`);
                        const responses = res.ok ? await res.json() : [];
                        return { ...form, responseCount: responses.length };
                    } catch (e) {
                        console.error("Erreur chargement réponses pour form", form.id, e);
                        return { ...form, responseCount: 0 };
                    }
                })
            );
                setForms(formsWithCounts);
            } catch (error) {
                console.error(error);
            }
        };

        fetchForms();
    }, []);

    const handleDeleteForm = async (formId) => {
        showModal(
            "Confirmation",
            "Êtes-vous sûr de vouloir supprimer ce formulaire ? Toutes les réponses associées seront perdues. Cette action est irréversible.",
            async () => {
                try {
                    const response = await fetch(`/api/forms/${formId}`, { method: "DELETE" });

                    if (response.ok) {
                        showModal("Succès", "Formulaire et réponses supprimés !");
                        setForms(forms.filter((form) => form.id !== formId)); // Mettre à jour la liste localement
                    } else {
                        const errorData = await response.json();
                        showModal("Erreur", "Erreur : " + errorData.error);
                    }
                } catch (error) {
                    console.error("Erreur :", error);
                    showModal("Erreur", "Impossible de contacter le serveur.");
                }
            }
        );
    };

    const handleEditForm = async (formId) => {
        try {
            const response = await fetch(`/api/forms/${formId}/has-responses`);
            const data = await response.json();

            if (data.hasResponses) {
                showModal("Attention", "Ce formulaire contient déjà des réponses et ne peut pas être modifié.");
            } else {
                navigate(`/form-editor2/${formId}`);
            }
        } catch (error) {
            console.error("Erreur lors de la vérification des réponses :", error);
            showModal("Erreur", "Erreur lors de la vérification des réponses.");
        }
    };

    const handleDuplicateForm = async (formId) => {
        try {
            const response = await fetch(`/api/forms/${formId}/duplicate`, { method: 'POST' });
            const data = await response.json();

            if (data.newFormId) {
                showModal("Succès", `Formulaire dupliqué avec succès ! Nouveau Formulaire ID: ${data.newFormId}`);
                // Rafraîchir la liste des formulaires après duplication
                const fetchForms = async () => {
                    try {
                        const response = await fetch('/api/forms');
                        if (!response.ok) throw new Error('Erreur lors du chargement des formulaires');
                        const data = await response.json();
                        setForms(data); // Mise à jour de la liste des formulaires
                    } catch (error) {
                        console.error(error);
                    }
                };
                fetchForms(); // Appel pour mettre à jour la liste
            } else {
                showModal("Erreur", "Erreur lors de la duplication du formulaire.");
            }
        } catch (error) {
            console.error("Erreur lors de la duplication du formulaire :", error);
            showModal("Erreur", "Impossible de contacter le serveur pour la duplication.");
        }
    };

    // Pour mettre à jour ce que tape l'utilisateur dans l'input
    // Juste avant le return (
    const handleDefaultUserIdChange = (e) => {
        setNewUserId(e.target.value);
    };


    // Pour sauvegarder le nouvel ID par défaut dans ta table server-side
    const handleSaveDefaultUserId = async () => {
        try {
            const response = await fetch('/api/default-user-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ defaultUserId: newUserId }),
            });

            if (!response.ok) throw new Error("Erreur lors de l'enregistrement de l'ID utilisateur par défaut.");

            showModal("Succès", "ID utilisateur par défaut enregistré !");
        } catch (error) {
            console.error(error);
            showModal("Erreur", "Impossible d'enregistrer l'ID utilisateur par défaut.");
        }
    };


    return (
        <>
             <div>
             <h1>XP-Forms</h1>
                {/* Champ pour entrer l'ID utilisateur par défaut */}
                <div className={styles.defaultUserIdContainer}>
                    <label htmlFor="defaultUserId" className={styles.defaultUserIdLabel}>
                        ID participant par défaut :
                    </label>
                    <input
                        id="defaultUserId"
                        type="text"
                        value={newUserId}
                        onChange={handleDefaultUserIdChange}
                        className={styles.defaultUserIdInput}
                    />
                    <button onClick={handleSaveDefaultUserId} className={styles.saveButton}>
                        Sauvegarder
                    </button>
                </div>
                <button
                    className={styles.createFormButton}
                    onClick={() => navigate("/form-editor2")}
                >
                    Créer un nouveau formulaire
                </button>
            </div>

            <div>
                <h2>Liste des formulaires enregistrés</h2>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Titre</th>
                            <th className={styles.th}>Date de création</th>
                            <th className={styles.th}>Dernière mise à jour</th>
                            <th className={styles.th}>Nombre de réponses</th>
                            <th className={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forms.length > 0 ? (
                            forms.map(form => (
                                <tr key={form.id}>
                                    <td>{form.title}</td>
                                    <td>{new Date(form.created_at).toLocaleString()}</td>
                                    <td>{new Date(form.updated_at).toLocaleString()}</td>
                                    <td>{form.responseCount}</td>
                                    <td className={styles.row}>
                                        <Link to={`/form-viewer/${form.id}/1?navigation=True`}>
                                            <button className={`${styles.button} ${styles.viewButton}`}>Voir</button>
                                        </Link>
                                        <button className={`${styles.button} ${styles.editButton}`} onClick={() => handleEditForm(form.id)}>Modifier</button>
                                        <Link to={`/form-responses/${form.id}`}>
                                            <button className={`${styles.button} ${styles.responsesButton}`}>Voir Réponses</button>
                                        </Link>
                                        <button className={`${styles.button} ${styles.duplicateButton}`} onClick={() => handleDuplicateForm(form.id)}>
                                            Dupliquer
                                        </button>
                                        <button className={`${styles.button} ${styles.deleteButton}`} onClick={() => handleDeleteForm(form.id)}>
                                            Supprimer
                                        </button>
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
            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onClose={closeModal}
                onConfirm={modal.onConfirm}
            />
        </>
    );
};

export default Accueil;

