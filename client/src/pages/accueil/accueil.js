import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import styles from './accueil.module.css'; // Import CSS Module
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";

const Accueil = () => {
    const [forms, setForms] = useState([]);
    const [selectedForms, setSelectedForms] = useState([]);
    const [newUserId, setNewUserId] = useState(localStorage.getItem('defaultUserId') || ""); // Utiliser la valeur du localStorage ou une valeur vide
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
    const navigate = useNavigate(); // Permet de gérer la navigation
    const isOneChecked = selectedForms.length > 0;
    const [folders, setFolders] = useState([]);
    const [moveModal, setMoveModal] = useState({open: false, type: null, item: null,});
    const [selectedFolder, setSelectedFolder] = useState("");


    const showModal = (title, message, onConfirm = null) => {
        setModal({ isOpen: true, title, message, onConfirm });
    };

    const closeModal = () => {
        setModal({ isOpen: false, title: "", message: "", onConfirm: null });
    };

    const reloadForms = async () => {
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
            const rootForms = formsWithCounts.filter(f => f.folder_id === null);
            setForms(rootForms);
        } catch (error) {
            console.error(error);
        }
    };

    const reloadFolders = async () => {
        try {
            const response = await fetch('/api/folders');
            if (!response.ok) throw new Error('Erreur lors du chargement des dossiers');
            const data = await response.json();
            setFolders(data);
        } catch (error) {
            console.error("Erreur reloadFolders :", error);
        }
    };

    useEffect(() => {
        reloadForms();
        reloadFolders();
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
                await reloadForms();

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

    // Affiche ou non les boutons pour tout dupliquer/supprimer
    const handleCheckboxChange = (formId, checked) => {
        if (checked) {
            setSelectedForms(prev => [...prev, formId]);
        } else {
            setSelectedForms(prev => prev.filter(id => id !== formId));
        }
    };

    // Tout cocher
    const handleCheckAll = () => {
        const allIds = forms.map(form => form.id);
        setSelectedForms(allIds);
    };

    // Tout décocher
    const handleUncheckAll = () => {
        setSelectedForms([]);
    };

    // Duplication de tous les formulaires cochés
    const handleDuplicateSelected = async () => {
        if (selectedForms.length === 0) return;

        showModal(
            "Duplication",
            `Dupliquer ${selectedForms.length} formulaire(s) ?`,
            async () => {
                try {
                    for (const formId of selectedForms) {
                        await fetch(`/api/forms/${formId}/duplicate`, { method: "POST" });
                    }

                    showModal("Succès", "Tous les formulaires sélectionnés ont été dupliqués !");

                    await reloadForms();
                    setSelectedForms([]); // Réinitialise la sélection

                } catch (error) {
                    console.error(error);
                    showModal("Erreur", "Impossible de dupliquer certains formulaires.");
                }
            }
        );
    };

    // Suppression de tous les formulaires cochés
    const handleDeleteSelected = async () => {
        if (selectedForms.length === 0) return;

        showModal(
            "Suppression",
            `Supprimer ${selectedForms.length} formulaire(s) ? Cette action est irréversible.`,
            async () => {
                try {
                    for (const formId of selectedForms) {
                        await fetch(`/api/forms/${formId}`, { method: "DELETE" });
                    }

                    showModal("Succès", "Tous les formulaires sélectionnés ont été supprimés !");

                    await reloadForms();
                    setSelectedForms([]); // Nettoyage
                } catch (error) {
                    console.error(error);
                    showModal("Erreur", "Impossible de supprimer certains formulaires.");
                }
            }
        );
    };

    const openMoveModal = (type, item) => {
        setMoveModal({ open: true, type, item });
    };

   const moveItem = async (newFolderId) => {
        if (!moveModal.item) return;

        try {
            if (moveModal.type === "form") {
                await fetch(`/api/forms/${moveModal.item.id}/move-to-folder/${newFolderId}`, {
                    method: "PUT",
                });
            } else {
                await fetch(`/api/folders/${moveModal.item.id}`, {
                    method: "PUT",
                    body: JSON.stringify({ parent_id: newFolderId }),
                    headers: { "Content-Type": "application/json" }
                });
            }

            setMoveModal({ open: false, item: null, type: null });
            await reloadFolders();
            await reloadForms();  
        } catch (err) {
            console.error("Erreur lors du déplacement :", err);
        }
    };

    const createFolder = () => {
        let folderName = prompt("Nom du nouveau dossier :");

        if (!folderName || folderName.trim() === "") return;

        fetch("/api/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: folderName })
        })
            .then(res => res.json())
            .then(() => reloadFolders())
            .catch(err => console.error("Erreur création dossier :", err));
    };

    const handleMove = async () => {
        if (!moveModal.item || !selectedFolder) return;

        await fetch(`/api/forms/${moveModal.item.id}/move`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folder_id: selectedFolder })
        });

        setMoveModal({ open: false, item: null });
        setSelectedFolder("");

        await reloadForms();
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

                <button
                    className={styles.createFormButton}
                    onClick={() => createFolder()}
                >
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
            </div>

            <div className={styles.folderContainer}>
                <h2>Dossiers</h2>

                {folders.length === 0 ? (
                    <p>Aucun dossier pour le moment</p>
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

                                        <td className={`${styles.row} ${styles.td}`} >
                                            <Link 
                                                to={`/form-viewer/${form.id}/1?navigation=True`}
                                                onClick={(e) => { if (isOneChecked) e.preventDefault(); }}
                                            >
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
                            ) }
                        </tbody>
                    </table>
                </div>
            </div >
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
                                    {folder.name}
                                </option>
                            ))}
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

export default Accueil;

