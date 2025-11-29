import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import styles from "../accueil/accueil.module.css";
import Modal from "../../components/Modal";

const FolderPage = () => {
    const { id } = useParams(); // ID du dossier courant
    const navigate = useNavigate();

    const [forms, setForms] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedForms, setSelectedForms] = useState([]);
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

    const isOneChecked = selectedForms.length > 0;

    const showModal = (title, message, onConfirm = null) => {
        setModal({ isOpen: true, title, message, onConfirm });
    };

    const closeModal = () => {
        setModal({ isOpen: false, title: "", message: "", onConfirm: null });
    };

    // ### 1) Récupère les formulaires du dossier ###
    const loadForms = async () => {
        try {
            const res = await fetch(`/api/forms?folder_id=${id}`);
            const data = await res.json();

            // Ajouter nombre de réponses
            const formsWithCounts = await Promise.all(
                data.map(async (form) => {
                    try {
                        const r = await fetch(`/api/forms/${form.id}/responses`);
                        const responses = r.ok ? await r.json() : [];
                        return { ...form, responseCount: responses.length };
                    } catch {
                        return { ...form, responseCount: 0 };
                    }
                })
            );

            setForms(formsWithCounts);
        } catch (e) {
            console.error(e);
        }
    };

    // ### 2) Récupère les sous-dossiers ###
    const loadFolders = async () => {
        try {
            const res = await fetch(`/api/folders?parent_id=${id}`);
            const data = await res.json();
            setFolders(data);
        } catch (e) {
            console.error("Erreur loadFolders :", e);
        }
    };

    useEffect(() => {
        loadForms();
        loadFolders();
    }, [id]);


    // ### 3) Créer un sous-dossier ###
    const createSubFolder = () => {
        const name = prompt("Nom du sous-dossier :");
        if (!name || !name.trim()) return;

        fetch("/api/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, parent_id: id })
        })
            .then(() => loadFolders())
            .catch(e => console.error("Erreur création sous-dossier :", e));
    };


    // ### 4) Créer un formulaire dans ce dossier ###
    const createFormInFolder = () => {
        navigate(`/form-editor2?folder_id=${id}`);
    };


    // ### 5) Suppression d’un formulaire ###
    const handleDeleteForm = async (formId) => {
        showModal(
            "Confirmation",
            "Supprimer ce formulaire ? (Toutes les réponses seront perdues)",
            async () => {
                try {
                    await fetch(`/api/forms/${formId}`, { method: "DELETE" });
                    setForms(forms.filter(f => f.id !== formId));
                } catch (e) {
                    console.error(e);
                }
            }
        );
    };


    return (
        <>
            <button className={styles.backButton} onClick={() => navigate("/")}>
                ⬅ Retour à l’accueil
            </button>

            <h1>Dossier : {id}</h1>

            <button className={styles.createFormButton} onClick={createFormInFolder}>
                Créer un formulaire dans ce dossier
            </button>

            <button className={styles.createFormButton} onClick={createSubFolder}>
                Créer un sous-dossier
            </button>

            {/* ------------------ Sous-dossiers ------------------- */}
            <div className={styles.folderContainer}>
                <h2>Sous-dossiers</h2>

                {folders.length === 0 ? (
                    <p>Aucun sous-dossier</p>
                ) : (
                    <div className={styles.folderGrid}>
                        {folders.map((folder) => (
                            <div
                                key={folder.id}
                                className={styles.folderItem}
                                onClick={() => navigate(`/folder/${folder.id}`)}
                            >
                                📁 {folder.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ------------------ Formulaires ------------------- */}
            <div className={styles.tableContainer}>
                <h2>Formulaires de ce dossier</h2>

                <div className={styles.scrollableTable}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Titre</th>
                                <th>Création</th>
                                <th>MàJ</th>
                                <th>Réponses</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {forms.length === 0 ? (
                                <tr>
                                    <td colSpan="6">Aucun formulaire dans ce dossier</td>
                                </tr>
                            ) : (
                                forms.map(form => (
                                    <tr key={form.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedForms.includes(form.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedForms(prev => [...prev, form.id]);
                                                    } else {
                                                        setSelectedForms(prev => prev.filter(id => id !== form.id));
                                                    }
                                                }}
                                            />
                                        </td>

                                        <td>{form.title}</td>
                                        <td>{new Date(form.created_at).toLocaleString()}</td>
                                        <td>{new Date(form.updated_at).toLocaleString()}</td>
                                        <td>{form.responseCount}</td>

                                        <td>
                                            <Link to={`/form-viewer/${form.id}/1?navigation=True`}>
                                                <button className={styles.viewButton}>Voir</button>
                                            </Link>

                                            <button
                                                className={styles.editButton}
                                                onClick={() => navigate(`/form-editor2/${form.id}`)}
                                            >
                                                Modifier
                                            </button>

                                            <Link to={`/form-responses/${form.id}`}>
                                                <button className={styles.responsesButton}>Réponses</button>
                                            </Link>

                                            <button
                                                className={styles.deleteButton}
                                                onClick={() => handleDeleteForm(form.id)}
                                            >
                                                Supprimer
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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

export default FolderPage;
