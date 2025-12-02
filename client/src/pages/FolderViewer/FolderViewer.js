import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import styles from "../accueil/accueil.module.css";
import Modal from "../../components/Modal";

const FolderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedForms, setSelectedForms] = useState([]);
    const [moveModal, setMoveModal] = useState({ open: false, type: null, item: null });
    const [modal, setModal] = useState({isOpen: false, title: "", message: "", onConfirm: null});
    const [selectedFolder, setSelectedFolder] = useState("");

    const isOneChecked = selectedForms.length > 0;

    const showModal = (title, message, onConfirm = null) => {
        setModal({ isOpen: true, title, message, onConfirm });
    };

    const closeModal = () => {
        setModal({ isOpen: false, title: "", message: "", onConfirm: null });
    };

    const reloadForms = async () => {
        try {
            const response = await fetch(`/api/forms?folder_id=${id}`);
            const data = await response.json();

            const formsWithCounts = await Promise.all(
                data.map(async (form) => {
                    try {
                        const res = await fetch(`/api/forms/${form.id}/responses`);
                        const responses = res.ok ? await res.json() : [];
                        return { ...form, responseCount: responses.length };
                    } catch {
                        return { ...form, responseCount: 0 };
                    }
                })
            );

            setForms(formsWithCounts);
        } catch (err) {
            console.error("Erreur loadForms :", err);
        }
    };

    const reloadFolders = async () => {
        try {
            const response = await fetch(`/api/folders?parent_id=${id}`);
            const data = await response.json();
            setFolders(data);
        } catch (err) {
            console.error("Erreur loadFolders :", err);
        }
    };

    useEffect(() => {
        reloadForms();
        reloadFolders();
    }, [id]);


    const createSubFolder = () => {
        const name = prompt("Nom du nouveau dossier :");
        if (!name || !name.trim()) return;

        fetch("/api/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, parent_id: id })
        })
            .then(() => reloadFolders())
            .catch(err => console.error("Erreur création dossier :", err));
    };

    const createFormInFolder = () => {
        navigate(`/form-editor2?folder_id=${id}`);
    };

    const handleDeleteForm = (formId) => {
        showModal(
            "Confirmation",
            "Supprimer ce formulaire ? Toutes les réponses seront perdues.",
            async () => {
                await fetch(`/api/forms/${formId}`, { method: "DELETE" });
                reloadForms();
            }
        );
    };

    const handleDuplicateForm = async (formId) => {
        try {
            await fetch(`/api/forms/${formId}/duplicate`, { method: "POST" });
            showModal("Succès", "Formulaire dupliqué !");
            reloadForms();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCheckboxChange = (formId, checked) => {
        if (checked) {
            setSelectedForms(prev => [...prev, formId]);
        } else {
            setSelectedForms(prev => prev.filter(id => id !== formId));
        }
    };

    const handleCheckAll = () => {
        const allIds = forms.map(form => form.id);
        setSelectedForms(allIds);
    };

    const handleUncheckAll = () => {
        setSelectedForms([]);
    };

    const handleDuplicateSelected = async () => {
        if (selectedForms.length === 0) return;
        showModal(
            "Duplication",
            `Dupliquer ${selectedForms.length} formulaire(s) ?`,
            async () => {
                for (const formId of selectedForms) {
                    await fetch(`/api/forms/${formId}/duplicate`, { method: "POST" });
                }
                showModal("Succès", "Duplication terminée !");
                setSelectedForms([]);
                reloadForms();
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

    const handleDeleteSelected = async () => {
        if (selectedForms.length === 0) return;

        showModal(
            "Suppression",
            `Supprimer ${selectedForms.length} formulaire(s) ?`,
            async () => {
                for (const formId of selectedForms) {
                    await fetch(`/api/forms/${formId}`, { method: "DELETE" });
                }
                showModal("Succès", "Suppression terminée !");
                setSelectedForms([]);
                reloadForms();
            }
        );
    };

    const handleMove = async () => {
        if (!moveModal.item || !selectedFolder) return;
        const folderIdToSend = selectedFolder === "root" ? null : selectedFolder;
        await fetch(`/api/forms/${moveModal.item.id}/move`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder_id: folderIdToSend })
        });

        setMoveModal({ open: false, item: null });
        setSelectedFolder("");

        await reloadForms();
    };

    const handleDeleteFolder = (folderId) => {
        showModal(
            "Supprimer le dossier",
            "ATTENTION : cela supprimera aussi tous les sous-dossiers et tous les formulaires qu'il contient. Voulez-vous continuer ?",
            async () => {
                await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
                reloadFolders();
                reloadForms();
            }
        );
    };




    return (
        <>
            <button className={styles.backButton} onClick={() => navigate("/")}>⬅ Retour à l'accueil</button>

            <h1>Dossier : {id}</h1>

            <button className={styles.createFormButton} onClick={createFormInFolder}>
                Créer un nouveau formulaire
            </button>

            <button className={styles.createFormButton} onClick={createSubFolder}>
                Créer un nouveau dossier
            </button>
            <button
                className={`${styles.button} ${styles.duplicateButton} ${styles.duplicateButtonCheck}`}
                style={{ display: selectedForms.length > 0 ? "inline-block" : "none" }}
                onClick={handleDuplicateSelected}
            >
                Dupliquer {selectedForms.length} formulaires
            </button> 

            <button
                className={`${styles.button} ${styles.deleteButton} ${styles.deleteButtonCheck}`}
                style={{ display: selectedForms.length > 0 ? "inline-block" : "none" }}
                onClick={handleDeleteSelected}
            >
                Supprimer {selectedForms.length} formulaires
            </button>

            <button
                className={`${styles.button} ${styles.checkButton}`}
                style={{ display: selectedForms.length === 0 ? "inline-block" : "none" }}
                onClick={handleCheckAll}
            >
                Tout Cocher
            </button>

            <button
                className={`${styles.button} ${styles.uncheckButton}`}
                style={{ display: selectedForms.length > 0 ? "inline-block" : "none" }}
                onClick={handleUncheckAll}
            >
                Tout Décocher
            </button>
                        

            <div className={styles.folderContainer}>
                <h2>Dossiers</h2>

                {folders.length === 0 ? (
                    <p>Aucun dossier</p>
                ) : (
                    <div className={styles.folderGrid}>
                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                className={styles.folderItem}
                                onClick={() => navigate(`/folder/${folder.id}`)}
                            >
                                📁 {folder.name}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();  // empêcher la navigation
                                        handleDeleteFolder(folder.id);
                                    }}
                                    className={styles.deleteFolderButton}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.tableContainer}>
                <h2>Liste des formulaires enregistrés</h2>

                <div className={styles.scrollableTable}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}></th>
                                <th className={styles.th}>Titre</th>
                                <th className={styles.th}>Date de création</th>
                                <th className={styles.th}>Dernière mise à jour</th>
                                <th className={styles.th}>Nombre de réponses</th>
                                <th className={styles.th}>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {forms.length === 0 ? (
                                <tr>
                                    <td colSpan="6">Aucun formulaire</td>
                                </tr>
                            ) : (
                                forms.map(form => (
                                    <tr key={form.id}>
                                        <td className={styles.td}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={selectedForms.includes(form.id)}
                                                onChange={(e) => handleCheckboxChange(form.id, e.target.checked)}
                                            />
                                        </td>

                                        <td className={styles.td}>{form.title}</td>
                                        <td className={styles.td}>{new Date(form.created_at).toLocaleString()}</td>
                                        <td className={styles.td}>{new Date(form.updated_at).toLocaleString()}</td>
                                        <td className={styles.td}>{form.responseCount}</td>

                                        <td className={`${styles.row} ${styles.td}`}>
                                            <Link 
                                                to={`/form-viewer/${form.id}/1?navigation=True`}
                                                onClick={(e) => { if (isOneChecked) e.preventDefault(); }}>
                                                <button 
                                                    className={`${styles.button} ${styles.viewButton}`}
                                                    disabled={isOneChecked}
                                                >
                                                    Voir
                                                </button>
                                            </Link>

                                            <button 
                                                className={`${styles.button} ${styles.editButton}`} 
                                                onClick={() => handleEditForm(form.id)}
                                                disabled={isOneChecked}
                                                >
                                                    Modifier
                                                </button>
                                            <Link 
                                                to={`/form-responses/${form.id}`}
                                                onClick={(e) => { if (isOneChecked) e.preventDefault(); }}
                                            >
                                                <button 
                                                    className={`${styles.button} ${styles.responsesButton}`}
                                                    disabled={isOneChecked}
                                                >
                                                    Voir Réponses
                                                </button>
                                            </Link>
                                            <button
                                                className={`${styles.button} ${styles.moveButton}`} 
                                                onClick={() => setMoveModal({ open: true, item: form })}
                                                disabled={isOneChecked}
                                            >
                                                Déplacer
                                            </button>
                                            <button
                                                className={`${styles.button} ${styles.duplicateButton}`} 
                                                onClick={() => handleDuplicateForm(form.id)}
                                                disabled={isOneChecked}
                                            >
                                                Dupliquer
                                            </button>

                                            <button
                                                className={`${styles.button} ${styles.deleteButton}`} 
                                                onClick={() => handleDeleteForm(form.id)}
                                                disabled={isOneChecked}
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
            {moveModal.open && (
                <div className={styles.moveModalOverlay}>
                    <div className={styles.moveModalContent}>
                        <h3>Déplacer vers…</h3>

                        <select
                            value={selectedFolder}
                            onChange={(e) => setSelectedFolder(e.target.value)}
                        >
                            <option value="">Sélectionner un dossier</option>
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>
                                   📁 {folder.name}
                                </option>
                            ))}
                            <option value="root">📁 Racine</option>
                        </select>

                        <div className={styles.buttonsRow}>
                            <button onClick={handleMove} disabled={!selectedFolder}>
                                Confirmer
                            </button>
                            <button onClick={() => setMoveModal({ open: false, item: null })}>
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FolderPage;
