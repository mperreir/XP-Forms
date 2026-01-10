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
    const [tableSelectedGroup, setTableSelectedGroup] = useState("");
    const [moveModal, setMoveModal] = useState({ open: false, type: null, item: null, selectedGroup: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState("forms");
    const menuRef = useRef(null);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [openGroupMenuId, setOpenGroupMenuId] = useState(null);
    const [groupMenuPosition, setGroupMenuPosition] = useState({ x: 0, y: 0 });
    const groupMenuRef = useRef(null);
    const [groupSearchQuery, setGroupSearchQuery] = useState("");


    const filteredForms = forms
        .filter(f => tableSelectedGroup ? f.group_id === Number(tableSelectedGroup) : true)
        .filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const filteredGroups = groups
        .filter(g => g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()));

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
                showNotification("Attention, ce formulaire contient déjà des réponses et ne peut pas être modifié." , "error");
            } else {
                navigate(`/form-editor2/${formId}`);
            }
        } catch (error) {
            console.error("Erreur lors de la vérification des réponses :", error);
            showNotification("Erreur lors de la vérification des réponses.", "error");
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

            showNotification("ID utilisateur par défaut enregistré !" , "success");
        } catch (error) {
            console.error(error);
            showNotification("Impossible d'enregistrer l'ID utilisateur par défaut.", "error");
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

    const handleCheckAllGroups = () => {
        const allIds = filteredGroups.map(group => group.id);
        setSelectedGroups(allIds);
    };

    const handleUncheckAllGroups = () => {
        setSelectedGroups([]);
    }

    // Duplication de tous les formulaires cochés
    const handleDuplicateForm = async (formId = null) => {

        const ids = formId ? (Array.isArray(formId) ? formId : [formId]) : selectedForms;

        if (!ids || ids.length === 0) return;
            try {
                for (const id of ids) {
                    await fetch(`/api/forms/${id}/duplicate`, { method: "POST" });
                }

                showNotification("Tous les formulaires sélectionnés ont été dupliqués !", "success");

                await reloadForms();
                await reloadgroups();
                setSelectedForms([]); // Réinitialise la sélection

            } catch (error) {
                console.error(error);
                showNotification("Impossible de dupliquer certains formulaires.", "error");
            }
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
                    closeModal();
                    for (const id of ids) {
                        await fetch(`/api/forms/${id}`, { method: "DELETE" });
                    }
                    showNotification("Tous les formulaires sélectionnés ont été supprimés !", "success");

                    await reloadForms();
                    await reloadgroups();
                    setSelectedForms([]); // Nettoyage
                } catch (error) {
                    console.error(error);
                    showNotification("Impossible de supprimer certains formulaires.", "error");
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
            .then(res => {
                res.json();
                showNotification("Groupe créé.", "success")
            })
            .then(() => reloadgroups())
            .catch(err => {
                console.log(err);
                showNotification("Impossible de contacter le serveur.", "error");
            })
    };

    const handleMove = async () => {
        if (!moveModal.selectedGroup) return;

        const itemsToMove = Array.isArray(moveModal.item.id) ? moveModal.item.id : [moveModal.item.id];

        for (const id of itemsToMove) {
            await fetch(`/api/forms/${id}/move-to-group/${moveModal.selectedGroup}`, {
                method: "PUT",
            });
        }
        showNotification(`Formulaire(s) déplacé(s)`, "success");

        setMoveModal({ open: false, item: null, selectedGroup: "" });
        setMoveModal({ open: false, item: null, selectedGroup: "" });
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
            "Suppression",
            "Supprimer le(s) groupe(s) ? Cette action est irréversible.",
            async () => {
                try {
                    closeModal();
                    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });

                    reloadgroups();
                    reloadForms();
                    setSelectedForms([]);
                    showNotification(`Groupe supprimé`, "success");

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
                            value={moveModal.selectedGroup}
                            onChange={(e) => setMoveModal(prev => ({ ...prev, selectedGroup: e.target.value }))}
                        >
                            <option value="">Sélectionner un groupe</option>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                   📁 {group.name}
                                </option>
                            ))}
                        </select>

                        <div className={styles.buttonsRow}>
                            <button onClick={handleMove} disabled={!moveModal.selectedGroup}>
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
                <div>
                    <div className={styles.tableHeader}>
                        <button
                            className={styles.createButton}
                            onClick={() => creategroup()}
                        >
                            Créer un nouveau formulaire
                        </button>
                        <h2 className={styles.tableTitle}>Liste des formulaires enregistrés</h2>
                    </div>
                    <div className={styles.tableContainer}>
                        <div>
                            <table className={styles.table}>
                                <thead className='thead'>
                                    <tr className={styles.filtrers}>
                                        <th className={styles.thFilter}></th>
                                        <th className={styles.thFilter}>
                                            <input
                                                type="text"
                                                placeholder="Rechercher un formulaire..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className={styles.headerSearchInput}
                                            />
                                        </th>
                                        <th className={styles.thFilter}>
                                            <select
                                                value={tableSelectedGroup}
                                                onChange={(e) => setTableSelectedGroup(e.target.value)}
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
                                        <th className={styles.thFilter}></th>
                                        <th className={styles.thFilter}></th>
                                        <th className={styles.thFilter}>
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
                                                className={`${styles.headerSelect} ${
                                                    selectedForms.length === 0 ? styles.selectDisabled : styles.selectEnabled
                                                }`}
                                            >
                                                <option value="">— Actions —</option>

                                                {selectedForms.length === 1 && (
                                                    <>
                                                        <option value="view">Voir</option>
                                                        <option
                                                            value="edit"
                                                            disabled={
                                                                forms.find(f => f.id === selectedForms[0])?.responseCount > 0
                                                            }
                                                        >
                                                            Modifier
                                                        </option>
                                                        <option value="responses">Voir réponses</option>
                                                    </>
                                                )}

                                                {selectedForms.length > 0 && (
                                                    <>
                                                        <option value="move">Déplacer</option>
                                                        <option value="duplicate">Dupliquer</option>
                                                        <option value="delete">Supprimer</option>
                                                    </>
                                                )}
                                            </select>
                                        </th>
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
                                        <th className={styles.th}>Groupe</th>
                                        <th className={styles.th}>Date de création</th>
                                        <th className={styles.th}>Dernière mise à jour</th>
                                        <th className={styles.th}>Nombre de réponses</th>
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
                                            <td className={styles.td}>{form.group_name || "-"}</td>
                                            <td className={styles.td}>{new Date(form.created_at).toLocaleString()}</td>
                                            <td className={styles.td}>{new Date(form.updated_at).toLocaleString()}</td>
                                            <td className={styles.td}>{form.responseCount}</td>
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
                    </div >
                </div>
            ) : (
                <div>
                    <div className={styles.tableHeader}>
                        <button
                            className={styles.createButton}
                            onClick={() => creategroup()}
                        >
                            Créer un nouveau groupe
                        </button>
                        <h2 className={styles.tableTitle}>Liste des groupes enregistrés</h2>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr className={styles.filter}>
                                    <th className={styles.thFilter}></th>
                                    <th className={styles.thFilter}>
                                        <input
                                            type="text"
                                            placeholder="Rechercher un groupe..."
                                            value={groupSearchQuery}
                                            onChange={(e) => setGroupSearchQuery(e.target.value)}
                                            className={styles.headerSearchInput}
                                        />
                                    </th>
                                    <th className={styles.thFilter}></th>
                                    <th className={styles.thFilter}></th>
                                    <th className={styles.thFilter}></th>
                                    <th className={styles.thFilter}>
                                        <select
                                            value=""
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
                                            className={`${styles.headerSelect} ${
                                                selectedGroups.length === 0 ? styles.selectDisabled : styles.selectEnabled
                                            }`}
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
                                    </th>
                                </tr>
                                <tr>
                                    <th className={styles.th}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={selectedGroups.length === filteredGroups.length && filteredGroups.length > 0}
                                            onChange={(e) => e.target.checked ? handleCheckAllGroups() : handleUncheckAllGroups()}
                                        />
                                    </th>
                                    <th className={styles.th}>Nom du groupe</th>
                                    <th className={styles.th}>Date de création</th>
                                    <th className={styles.th}>Dernière mise à jour</th>
                                    <th className={styles.th}>Nombre de formulaires</th>
                                    <th className={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className={styles.scrollableTable}>
                                {filteredGroups.map(group => (
                                    <tr
                                        key={group.id}
                                        onContextMenu={(e) => handleRightClickGroup(e, group.id)}
                                    >
                                        <td className={styles.td}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={selectedGroups.includes(group.id)}
                                                onChange={(e) => handleGroupCheckboxChange(group.id, e.target.checked)}
                                            />
                                        </td>
                                        <td className={styles.td}>{group.name}</td>
                                        <td className={styles.td}>{new Date(group.created_at).toLocaleString()}</td>
                                        <td className={styles.td}>{new Date(group.updated_at).toLocaleString()}</td>
                                        <td className={styles.td}>{group.formsCount || 0}</td>
                                        <td className={styles.td}>
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
                    {(() => {
                        const form = forms.find(f => f.id === openMenuId);
                        const disabled = form?.responseCount > 0;

                        return (
                            <div
                                className={disabled ? styles.disabledAction : ""}
                                onClick={() => {
                                    if (!disabled) handleEditForm(openMenuId);
                                }}
                            >
                                Modifier
                            </div>
                        );
                    })()}
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

