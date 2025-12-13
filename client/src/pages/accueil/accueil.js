import React, { useEffect, useState, useRef } from 'react';
import styles from './accueil.module.css'; // Import CSS Module
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";


const Accueil = () => {
    const [forms, setForms] = useState([]);
    const [selectedForms, setSelectedForms] = useState([]);
    const [newUserId, setNewUserId] = useState(localStorage.getItem('defaultUserId') || ""); // Utiliser la valeur du localStorage ou une valeur vide
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null });
    const [notification, setNotification] = useState({ message: "", type: "" });
    const navigate = useNavigate(); // Permet de gérer la navigation
    const [groups, setgroups] = useState([]);
    const [moveModal, setMoveModal] = useState({open: false, type: null, item: null,});
    const [selectedGroup, setSelectedGroup] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState("forms");
    const menuRef = useRef(null);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [openGroupMenuId, setOpenGroupMenuId] = useState(null);
    const [groupMenuPosition, setGroupMenuPosition] = useState({ x: 0, y: 0 });
    const groupMenuRef = useRef(null);


    const filteredForms = forms
        .filter(f => selectedGroup ? f.group_id === Number(selectedGroup) : true)
        .filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const showModal = (title, message, onConfirm = null) => {
        setModal({ isOpen: true, title, message, onConfirm });
    };

    const closeModal = () => {
        setModal({ isOpen: false, title: "", message: "", onConfirm: null });
    };

    const showNotification = (message, type = "success", duration = 3000) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification({ message: "", type: "" });
        }, duration);
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
            setForms(formsWithCounts);
        } catch (error) {
            console.error(error);
        }
    };

    const reloadgroups = async () => {
        try {
            const response = await fetch('/api/groups');
            if (!response.ok) throw new Error('Erreur lors du chargement des groupes');
            const data = await response.json();
            const groupsWithCounts = await Promise.all(
                data.map(async (group) => {
                    try {
                        const res = await fetch(`/api/groups/${group.id}/count`);
                        const result = res.ok ? await res.json() : { count: 0 };
                        return { ...group, formsCount: result.count };
                    } catch (e) {
                        console.error("Erreur chargement forms pour group", group.id, e);
                        return { ...group, formsCount: 0 };
                    }
                })
            );
            setgroups(groupsWithCounts);
        } catch (error) {
            console.error("Erreur reloadgroups :", error);
        }
    };

    useEffect(() => {
        reloadForms();
        reloadgroups();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (openMenuId && menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenuId(null);
            }
            if (openGroupMenuId && groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
                setOpenGroupMenuId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openMenuId, openGroupMenuId]);

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
        const allIds = filteredForms.map(form => form.id);
        setSelectedForms(allIds);
    };

    // Tout décocher
    const handleUncheckAll = () => {
        setSelectedForms([]);
    };

    // Duplication de tous les formulaires cochés
    const handleDuplicateForm = async (formId = null) => {

        const ids = formId ? (Array.isArray(formId) ? formId : [formId]) : selectedForms;

        if (!ids || ids.length === 0) return;

        showModal(
            "Duplication",
            `Dupliquer ${ids.length} formulaire(s) ?`,
            async () => {
                try {
                    for (const id of ids) {
                        await fetch(`/api/forms/${id}/duplicate`, { method: "POST" });
                    }

                    showModal("Succès", "Tous les formulaires sélectionnés ont été dupliqués !");

                    await reloadForms();
                    await reloadgroups();
                    setSelectedForms([]); // Réinitialise la sélection

                } catch (error) {
                    console.error(error);
                    showModal("Erreur", "Impossible de dupliquer certains formulaires.");
                }
            }
        );
    };

    // Suppression de tous les formulaires cochés
    const handleDeleteForm = async (formId = null) => {

        const ids = formId ? (Array.isArray(formId) ? formId : [formId]) : selectedForms;

        if (!ids || ids.length === 0) return;

        showModal(
            "Suppression",
            `Supprimer ${ids.length} formulaire(s) ? Cette action est irréversible.`,
            async () => {
                try {
                    for (const id of ids) {
                        await fetch(`/api/forms/${id}`, { method: "DELETE" });
                    }

                    showModal("Succès", "Tous les formulaires sélectionnés ont été supprimés !");

                    await reloadForms();
                    await reloadgroups();
                    setSelectedForms([]); // Nettoyage
                } catch (error) {
                    console.error(error);
                    showModal("Erreur", "Impossible de supprimer certains formulaires.");
                }
            }
        );
    };

    const creategroup = () => {
        let groupName = prompt("Nom du nouveau groupe :");

        if (!groupName || groupName.trim() === "") return;

        fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: groupName })
        })
            .then(res => res.json())
            .then(() => reloadgroups())
            .catch(err => console.error("Erreur création groupe :", err));
    };

    const handleMove = async () => {
        if (!selectedGroup) return;

        const itemsToMove = Array.isArray(moveModal.item.id) ? moveModal.item.id : [moveModal.item.id];

        for (const id of itemsToMove) {
            await fetch(`/api/forms/${id}/move-to-group/${selectedGroup}`, {
                method: "PUT",
            });
        }
        showNotification(`Formulaire(s) déplacé(s)`, "success");

        setMoveModal({ open: false, item: null });
        setSelectedGroup("");
        setSelectedForms([]);

        await reloadForms();
        await reloadgroups();
    };

    const handleRenameGroup = async (groupId, currentName) => {
        const newName = prompt("Nouveau nom du groupe :", currentName);
        if (!newName || newName.trim() === "") return;

        try {
            const response = await fetch(`/api/groups/${groupId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            });

            if (!response.ok) throw new Error("Erreur lors du renommage du groupe");

            await reloadgroups();
            await reloadForms();
            showNotification(`Groupe renommé en "${newName}"`, "success");

        } catch (err) {
            console.error(err);
            showNotification("Impossible de renommer le groupe", "error");
        }
    };


    const handleDeletegroup = (groupId) => {
        showModal(
            "Supprimer le groupe",
            "ATTENTION : cela supprimera aussi tous les sous-groupes et tous les formulaires qu'il contient. Voulez-vous continuer ?",
            async () => {
                try {
                    closeModal();
                    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });

                    reloadgroups();
                    reloadForms();
                    showNotification(`groupe supprimé`, "success");

                } catch(err) {
                    console.error(err);
                    showNotification("Impossible de dupliquer le groupe.", "error");
                }
                
            }
        );
    };

    const handleRightClick = (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        const MENU_HEIGHT = 220;

        let y = e.clientY;

        if (y + MENU_HEIGHT > window.innerHeight) {
            y = y - MENU_HEIGHT + 38;
        }

        setMenuPosition({
            x: e.clientX,
            y,
        });

        setOpenMenuId(id);
    };

    const handleGroupCheckboxChange = (groupId, checked) => {
        if (checked) setSelectedGroups(prev => [...prev, groupId]);
        else setSelectedGroups(prev => prev.filter(id => id !== groupId));
    };

    const handleCheckAllGroups = () => {
        const allIds = groups.map(group => group.id);
        setSelectedGroups(allIds);
    };

    const handleUncheckAllGroups = () => setSelectedGroups([]);

    const handleRightClickGroup = (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        const MENU_HEIGHT = 100; // Hauteur du menu actions groupes
        let y = e.clientY;
        if (y + MENU_HEIGHT > window.innerHeight) y = y - MENU_HEIGHT + 32;

        setGroupMenuPosition({ x: e.clientX, y });
        setOpenGroupMenuId(id);
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
                    onClick={() => creategroup()}
                >
                    Créer un nouveau groupe
                </button>
            </div>

            <div className={styles.displayType}>
                <button 
                    onClick={() => setViewMode("forms")}
                    className={`${styles.viewButton} ${viewMode === "forms" ? styles.activeViewButton : ""} ${styles.switchToViewForms}`}
                >
                    Formulaires
                </button>

                <button 
                    onClick={() => setViewMode("groups")}
                    className={`${styles.viewButton} ${viewMode === "groups" ? styles.activeViewButton : ""} ${styles.switchToViewGroups}`}
                >
                    Groupes
                </button>
            </div>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onClose={closeModal}
                onConfirm={modal.onConfirm}
            />
            {notification.message && (
                <div className={`${styles.notification} ${styles[notification.type]}`}>
                    {notification.message}
                </div>
            )}
            {moveModal.open && (
                <div className={styles.moveModalOverlay}>
                    <div className={styles.moveModalContent}>
                        <h3>Déplacer vers…</h3>

                        <select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                        >
                            <option value="">Sélectionner un groupe</option>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                   📁 {group.name}
                                </option>
                            ))}
                        </select>

                        <div className={styles.buttonsRow}>
                            <button onClick={handleMove} disabled={!selectedGroup}>
                                Confirmer
                            </button>
                            <button onClick={() => setMoveModal({ open: false, item: null })}>
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {viewMode === "forms" ? (
                <div className={styles.tableContainer}>
                    <h2>Liste des formulaires enregistrés</h2>

                    <div>
                        <table className={styles.table}>
                            <thead className='thead'>
                                <tr className={styles.filtrers}>
                                    <th className={styles.thFilter}>
                                    </th>
                                    <th className={styles.thFilter}>
                                    <input
                                        type="text"
                                        placeholder="Rechercher un formulaire..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={styles.headerSearchInput}
                                    />
                                    </th>
                                    <th className={styles.thFilter}></th>
                                    <th className={styles.thFilter}></th>
                                    <th className={styles.thFilter}></th>
                                    <th className={styles.thFilter}>
                                    <select
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                        className={styles.headerSelect}
                                    >
                                        <option value="">Tous les groupes</option>
                                        {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                        ))}
                                    </select>
                                    </th>
                                    <th className={styles.thFilter}></th>
                                </tr>
                                <tr>
                                    <th className={styles.th}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={selectedForms.length === filteredForms.length && filteredForms.length > 0}
                                        onChange={(e) => {
                                        if (e.target.checked) handleCheckAll();
                                        else handleUncheckAll();
                                        }}
                                    />
                                    </th>
                                    <th className={styles.th}>Titre</th>
                                    <th className={styles.th}>Date de création</th>
                                    <th className={styles.th}>Dernière mise à jour</th>
                                    <th className={styles.th}>Nombre de réponses</th>
                                    <th className={styles.th}>Groupe</th>
                                    <th className={styles.th}>Actions</th>
                                </tr>
                            </thead>

                            <tbody className={styles.scrollableTable}>
                                {forms.length === 0 ? (
                                    <tr>
                                    <td colSpan="7">Aucun formulaire</td>
                                    </tr>
                                ) : (
                                    filteredForms.map(form => (
                                    <tr 
                                        key={form.id}
                                        onContextMenu={(e) => {
                                            handleRightClick(e, form.id)
                                        }}
                                    >
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
                                        <td className={styles.td}>{form.group_name || "-"}</td>
                                        <td className={styles.td}>
                                            <div className={styles.actionWrapper}>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const MENU_HEIGHT = 220;

                                                        let y = rect.bottom;

                                                        if (y + MENU_HEIGHT > window.innerHeight) {
                                                            y = rect.top - MENU_HEIGHT + 38;
                                                        }

                                                        setMenuPosition({
                                                            x: rect.left,
                                                            y,
                                                        });

                                                        setOpenMenuId(openMenuId === form.id ? null : form.id);
                                                    }}
                                                >
                                                    ...
                                                </button>
                                                
                                            </div>

                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.actionBar}>
                        <span>{selectedForms.length} sélectionné(s)</span>

                        <select
                            value=""
                            disabled={selectedForms.length === 0}
                            onChange={(e) => {
                                const action = e.target.value;
                                e.target.value = ""; 

                                if (!action) return;

                                const isMultiple = selectedForms.length > 1;
                                const id = selectedForms;

                                switch (action) {
                                    case "view":
                                        if (!isMultiple) navigate(`/form-viewer/${id}/1?navigation=True`);
                                        break;
                                    case "edit":
                                        if (!isMultiple) handleEditForm(id);
                                        break;
                                    case "responses":
                                        if (!isMultiple) navigate(`/form-responses/${id}`);
                                        break;
                                    case "move":
                                        setMoveModal({ open: true, item: { id: selectedForms } });
                                        break;
                                    case "duplicate":
                                        handleDuplicateForm(id);
                                        break;
                                    case "delete":
                                        handleDeleteForm(id);
                                        break;
                                    default:
                                        break;
                                }
                            }}
                            className={styles.actionSelect}
                        >
                            
                            <option value="">— Actions —</option>

                            {selectedForms.length === 1 && (
                                <>
                                    <option value="view">Voir</option>
                                    <option value="edit">Modifier</option>
                                    <option value="responses">Voir réponses</option>
                                </>
                            )}

                            {selectedForms.length > 0 && (
                                <>
                                    <option value="move">Déplacer</option>
                                    <option value="duplicate">
                                        Dupliquer
                                    </option>
                                    <option value="delete">
                                        Supprimer
                                    </option>
                                </>
                            )}
                        </select>
                    </div>
                </div >
            ) : (
                <div className={styles.tableContainer}>
                    <h2>Liste des groupes enregistrés</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.filtrers}>
                                <th>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={selectedGroups.length === groups.length && groups.length > 0}
                                        onChange={(e) => e.target.checked ? handleCheckAllGroups() : handleUncheckAllGroups()}
                                    />
                                </th>
                                <th>Nom du groupe</th>
                                <th>Date de création</th>
                                <th>Dernière mise à jour</th>
                                <th>Nombre de formulaires</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={styles.scrollableTable}>
                            {groups.map(group => (
                                <tr
                                    key={group.id}
                                    onContextMenu={(e) => handleRightClickGroup(e, group.id)}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={selectedGroups.includes(group.id)}
                                            onChange={(e) => handleGroupCheckboxChange(group.id, e.target.checked)}
                                        />
                                    </td>
                                    <td>{group.name}</td>
                                    <td>{new Date(group.created_at).toLocaleString()}</td>
                                    <td>{new Date(group.updated_at).toLocaleString()}</td>
                                    <td>{group.formsCount || 0}</td>
                                    <td>
                                        <button
                                            className={styles.actionButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const MENU_HEIGHT = 100;
                                                let y = rect.bottom;
                                                if (y + MENU_HEIGHT > window.innerHeight) y = rect.top - MENU_HEIGHT + 38;
                                                setGroupMenuPosition({ x: rect.left, y });
                                                setOpenGroupMenuId(openGroupMenuId === group.id ? null : group.id);
                                            }}
                                        >
                                            ...
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className={styles.actionBar}>
                        <span>{selectedGroups.length} sélectionné(s)</span>

                        <select
                            value=""
                            disabled={selectedGroups.length === 0}
                            onChange={(e) => {
                                const action = e.target.value;
                                e.target.value = ""; 

                                if (!action) return;

                                const isMultiple = selectedGroups.length > 1;
                                const id = selectedGroups;

                                switch (action) {
                                    case "rename":
                                        if (!isMultiple) handleRenameGroup(id);
                                        break;
                                    case "delete":
                                        handleDeletegroup(id);
                                        break;
                                    default:
                                        break;
                                }
                            }}
                            className={styles.actionSelect}
                        >
                            
                            <option value="">— Actions —</option>

                            {selectedGroups.length === 1 && (
                                <>
                                    <option value="rename">Renommer</option>
                                </>
                            )}

                            {selectedGroups.length > 0 && (
                                <>
                                    <option value="delete">
                                        Supprimer
                                    </option>
                                </>
                            )}
                        </select>
                    </div>
                </div>
            )}
            {openMenuId && (
                <div
                    ref={menuRef}
                    className={styles.actionMenu}
                    style={{
                        top: menuPosition.y,
                        left: menuPosition.x,
                    }}
                >
                    <div onClick={() => navigate(`/form-viewer/${openMenuId}/1?navigation=True`)}>Voir</div>
                    <div onClick={() => handleEditForm(openMenuId)}>Modifier</div>
                    <div onClick={() => navigate(`/form-responses/${openMenuId}`)}>Réponses</div>
                    <div onClick={() => setMoveModal({ open: true, item: { id: [openMenuId] } })}>Déplacer</div>
                    <div onClick={() => handleDuplicateForm(openMenuId)}>Dupliquer</div>
                    <div onClick={() => handleDeleteForm(openMenuId)}>Supprimer</div>
                </div>
            )}
            {openGroupMenuId && (
                <div
                    ref={groupMenuRef}
                    className={styles.actionMenu}
                    style={{ top: groupMenuPosition.y, left: groupMenuPosition.x }}
                >
                    <div onClick={() => handleRenameGroup(openGroupMenuId, groups.find(g => g.id === openGroupMenuId)?.name)}>Renommer</div>
                    <div onClick={() => handleDeletegroup(openGroupMenuId)}>Supprimer</div>
                </div>
            )}
        </>
    );
};

export default Accueil;

