import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './accueil.module.css'; // Import CSS Module
import { createBrowserRouter, useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import ImportModal from '../../components/ImportModal';

const Accueil = () => {
    const { t, i18n } = useTranslation();
    const [forms, setForms] = useState([]);
    const [selectedForms, setSelectedForms] = useState([]);
    const [newUserId, setNewUserId] = useState(localStorage.getItem('defaultUserId') || ""); // Utiliser la valeur du localStorage ou une valeur vide
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null, confirm: '', close: '', onClose: null });
    const [importModal, setImportModal] = useState({ isOpen: false, onConfirm: null, onFormatError: null, onError: null });
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

    const showModal = (title, message, onConfirm = null, confirm = t('Confirm'), close = t('Close'), onClose = closeModal) => {
        setModal({ isOpen: true, title, message, onConfirm, confirm, close, onClose });
    };

    const closeModal = () => {
        setModal({ isOpen: false, title: "", message: "", onConfirm: null, confirm: '', close: '', onClose: null });
    };

    const showImportModal = (onConfirm = null, onFormatError = null, onError = null) => {
        setImportModal({ isOpen: true, onConfirm, onFormatError, onError });
    };

    const closeImportModal = () => {
        setImportModal({ isOpen: false, onConfirm: null, onFormatError: null, onError: null });
    };

    const fetchForms = async () => {
        try {
            const response = await fetch('/api/forms');
            if (!response.ok) throw new Error(t('Error loading forms'));
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

    const showNotification = (message, type = "success", duration = 3000) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification({ message: "", type: "" });
        }, duration);
    };

    const reloadForms = async () => {
        try {
            const response = await fetch('/api/forms');
            if (!response.ok) throw new Error(t('Error loading forms'));
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
            if (!response.ok) throw new Error(t('Error loading groups'));
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
            console.error(t("Error loading groups"), error);
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
                showNotification(t("This form already has responses and cannot be edited."), t("error"));
            } else {
                navigate(`/form-editor2/${formId}`);
            }
        } catch (error) {
            console.error(t("Error checking responses:"), error);
            showNotification(t("Error checking responses."), t("error"));
        }
    };

    const handleExportForm = async (formId) => {

        const ids = formId ? (Array.isArray(formId) ? formId : [formId]) : selectedForms;

        if (!ids || ids.length === 0) return;

        const DownloadExport = async (jsonExport) => {

            // Téléchargement du fichier exporté
            let element = document.createElement('a');
            element.setAttribute('href',
                'data:text/json;charset=utf-8, '
                + encodeURIComponent(JSON.stringify(jsonExport, null, 2)));
            element.setAttribute('download', jsonExport.title + '.json');

            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);

            closeModal();
            showNotification(t("Form exported!"), t("success"));

        };

        const exportForm = async (ids, resp = false) => {

            console.log(ids);
            let jsonExport = {};

            for (let i = 0; i < ids.length; i++) {
                let id = ids[i]
                try {
                    const response = await fetch(`/api/forms/${id}/export/${resp}`);

                    if (response.ok) {

                        const formJson = await response.json();

                        jsonExport[i + 1] = formJson;

                    } else {
                        const errorData = await response.json();
                        showNotification(t("Error: ") + errorData.error, t("error"));
                    }
                } catch (error) {
                    console.error(t("Error:"), error);
                    showNotification(t("Unable to contact the server."), t("error"));
                }
            }

            DownloadExport(jsonExport);
        }

        showModal(t('Export'), t('Do you also want to export the responses?'), () => { exportForm(ids, true) }, t('Yes'), t('No'), () => { exportForm(ids) });
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

            if (!response.ok) throw new Error(t("Error saving default user ID."));

            showNotification(t("Default user ID saved!"), t("success"));
        } catch (error) {
            console.error(error);
            showNotification(t("Unable to save default user ID."), t("error"));
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

            showNotification(t("All selected forms have been duplicated!"), t("success"));

            await reloadForms();
            await reloadgroups();
            setSelectedForms([]); // Réinitialise la sélection

        } catch (error) {
            console.error(error);
            showNotification(t("Unable to duplicate some forms."), t("error"));
        }
    };

    // Suppression de tous les formulaires cochés
    const handleDeleteForm = async (formId = null) => {

        const ids = formId ? (Array.isArray(formId) ? formId : [formId]) : selectedForms;

        if (!ids || ids.length === 0) return;

        showModal(
            t("Suppression"),
            t("Supprimer {ids} formulaire(s) ? Cette action est irréversible.", { ids: ids.length }),
            async () => {
                try {
                    closeModal();
                    for (const id of ids) {
                        await fetch(`/api/forms/${id}`, { method: "DELETE" });
                    }
                    showNotification(t("All selected forms have been deleted!"), t("success"));

                    await reloadForms();
                    await reloadgroups();
                    setSelectedForms([]); // Nettoyage
                } catch (error) {
                    console.error(error);
                    showNotification(t("Unable to delete some forms."), t("error"));
                }
            }
        );
    };

    const creategroup = () => {
        let groupName = prompt(t("Nom du nouveau groupe :"));

        if (!groupName || groupName.trim() === "") return;

        fetch("/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: groupName })
        })
            .then(res => {
                res.json();
                showNotification(t("Group created."), t("success"));
            })
            .then(() => reloadgroups())
            .catch(err => {
                console.log(err);
                showNotification(t("Unable to contact the server."), t("error"));
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
        showNotification(t("Form(s) moved"), t("success"));

        setMoveModal({ open: false, item: null, selectedGroup: "" });
        setMoveModal({ open: false, item: null, selectedGroup: "" });
        setSelectedForms([]);

        await reloadForms();
        await reloadgroups();
    };

    const handleRenameGroup = async (groupId, currentName) => {
        const newName = prompt(t("Nouveau nom du groupe :"), currentName);
        if (!newName || newName.trim() === "") return;

        try {
            const response = await fetch(`/api/groups/${groupId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            });

            if (!response.ok) throw new Error(t("Erreur lors du renommage du groupe"));

            await reloadgroups();
            await reloadForms();
            showNotification(t(`Groupe renommé en "${newName}"`), t("success"));

        } catch (err) {
            console.error(err);
            showNotification(t("Impossible de renommer le groupe"), t("error"));
        }
    };


    const handleDeletegroup = (groupId) => {
        showModal(
            t("Suppression"),
            t("Supprimer le(s) groupe(s) ? Cette action est irréversible."),
            async () => {
                try {
                    closeModal();
                    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });

                    reloadgroups();
                    reloadForms();
                    setSelectedForms([]);
                    showNotification(t("Group(s) deleted"), t("success"));

                } catch (err) {
                    console.error(err);
                    showNotification(t("Unable to delete group(s)."), t("error"));
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


    const handleImportButton = () => {
        showImportModal(() => {
            closeImportModal();
            fetchForms();
            showNotification(t("Form imported!"), t("success"));
        },
            () => {
                closeImportModal();
                fetchForms();
                showNotification(t("File content incompatible."), t("error"));
            },
            () => {
                closeImportModal();
                fetchForms();
                showNotification(t("Unable to contact the server."), t("error"));
            });
    }



    return (
        <>
            <div style={{ padding: '16px' }}>
                <h1>{t('welcome')}</h1>
                <button className={styles.langSwitch} onClick={() => i18n.changeLanguage('fr')}>FR</button>
                <button className={styles.langSwitch} onClick={() => i18n.changeLanguage('en')}>EN</button>
                {/* Champ pour entrer l'ID utilisateur par défaut */}
            </div>

            <div className={styles.displayType}>
                <button
                    onClick={() => {
                        setViewMode("forms"); 
                        handleUncheckAll();
                    }}
                    className={`${styles.viewButton} ${viewMode === "forms" ? styles.activeViewButton : ""} ${styles.switchToViewForms}`}
                >
                    {t('Forms')}
                </button>

                <button
                    onClick={() => {
                        setViewMode("groups");
                        handleUncheckAllGroups();
                    }}
                    className={`${styles.viewButton} ${viewMode === "groups" ? styles.activeViewButton : ""} ${styles.switchToViewGroups}`}
                >
                    {t('Groups')}
                </button>
            </div>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onClose={modal.onClose}
                onConfirm={modal.onConfirm}
                confirm={modal.confirm}
                close={modal.close}
            />
            <ImportModal
                isOpen={importModal.isOpen}
                onConfirm={importModal.onConfirm}
                onClose={closeImportModal}
                onFormatError={importModal.onFormatError}
                onError={importModal.onError}
            />
            {notification.message && (
                <div className={`${styles.notification} ${styles[notification.type]}`}>
                    {notification.message}
                </div>
            )}
            {moveModal.open && (
                <div className={styles.moveModalOverlay}>
                    <div className={styles.moveModalContent}>
                        <h3>{t("Move to…")}</h3>

                        <select
                            value={moveModal.selectedGroup}
                            onChange={(e) => setMoveModal(prev => ({ ...prev, selectedGroup: e.target.value }))}
                        >
                            <option value="">{t("Select a group")}</option>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                    📁 {group.name}
                                </option>
                            ))}
                        </select>

                        <div className={styles.buttonsRow}>
                            <button onClick={handleMove} disabled={!moveModal.selectedGroup}>
                                {t("Confirm")}
                            </button>
                            <button onClick={() => setMoveModal({ open: false, item: null })}>
                                {t("Cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {viewMode === "forms" ? (
                <div>
                    <div className={styles.tableHeader}>
                        <div className={styles.defaultUserIdContainer}>
                            <label htmlFor="defaultUserId" className={styles.defaultUserIdLabel}>
                                {t("Default participant ID:")}
                            </label>
                            <input
                                id="defaultUserId"
                                type="text"
                                value={newUserId}
                                onChange={handleDefaultUserIdChange}
                                className={styles.defaultUserIdInput}
                            />
                            <button onClick={handleSaveDefaultUserId} className={styles.saveButton}>
                                {t("Save")}
                            </button>
                        </div>
                        <h2 className={styles.tableTitle}>{t("List of saved forms")}</h2>
                        <div className={styles.createButtonContainer}>
                            <button
                                className={styles.createButton}
                                onClick={() => navigate("/form-editor2")}
                            >
                                {t("Create a new form")}
                            </button>
                        </div>
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
                                                placeholder={t("Search a form...")}
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
                                                <option value="">{t("All groups")}</option>
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
                                                        case "export":
                                                            handleExportForm(id);
                                                            break;
                                                        default:
                                                            break;
                                                    }
                                                }}
                                                className={`${styles.headerSelect} ${
                                                    selectedForms.length === 0 ? styles.selectDisabled : styles.selectEnabled
                                                }`}
                                            >
                                                <option value="">— {t("Actions")} —</option>

                                                {selectedForms.length === 1 && (
                                                    <>
                                                        <option value="view">{t("View")}</option>
                                                        <option
                                                            value="edit"
                                                            disabled={
                                                                forms.find(f => f.id === selectedForms[0])?.responseCount > 0
                                                            }
                                                        >
                                                            {t("Edit")}
                                                        </option>
                                                        <option value="responses">{t("View responses")}</option>
                                                    </>
                                                )}

                                                {selectedForms.length > 0 && (
                                                    <>
                                                        <option value="move">{t("Move")}</option>
                                                        <option value="duplicate">{t("Duplicate")}</option>
                                                        <option value="delete">{t("Delete")}</option>
                                                        <option value="export">{t("Export")}</option>
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
                                        <th className={styles.th}>{t("Title")}</th>
                                        <th className={styles.th}>{t("Group")}</th>
                                        <th className={styles.th}>{t("Creation date")}</th>
                                        <th className={styles.th}>{t("Last update")}</th>
                                        <th className={styles.th}>{t("Number of responses")}</th>
                                        <th className={styles.th}>{t("Actions")}</th>
                                    </tr>
                                </thead>

                                <tbody className={styles.scrollableTable}>
                                    {forms.length === 0 ? (
                                        <tr>
                                        <td colSpan="7">{t("No forms")}</td>
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
                        <div className={styles.defaultUserIdContainer}>
                            <label htmlFor="defaultUserId" className={styles.defaultUserIdLabel}>
                                t{t("Default participant ID")} :
                            </label>
                            <input
                                id="defaultUserId"
                                type="text"
                                value={newUserId}
                                onChange={handleDefaultUserIdChange}
                                className={styles.defaultUserIdInput}
                            />
                            <button onClick={handleSaveDefaultUserId} className={styles.saveButton}>
                                {t("Save")}
                            </button>
                        </div>
                        <h2 className={styles.tableTitle}>
                            {t("List of saved groups")}
                        </h2>
                        <div className={styles.createButtonContainer}>
                            <button
                                className={styles.createButton}
                                onClick={() => creategroup()}
                            >
                                {t("Create a new group")}
                            </button>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr className={styles.filtrers}>
                                    <th className={styles.thFilter}></th>

                                    <th className={styles.thFilter}>
                                        <input
                                            type="text"
                                            placeholder={t("Search for a group...")}
                                            value={groupSearchQuery}
                                            onChange={(e) => setGroupSearchQuery(e.target.value)}
                                            className={styles.headerSearchInput}
                                        />
                                    </th>

                                    <th className={styles.thFilter}></th>
                                    <th className={styles.thFilter}></th>
                                    <th className={styles.thFilter}></th>

                                    {/* ACTIONS MULTIPLES */}
                                    <th className={styles.thFilter}>
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
                                            className={`${styles.headerSelect} ${
                                                selectedGroups.length === 0
                                                    ? styles.selectDisabled
                                                    : styles.selectEnabled
                                            }`}
                                        >
                                            <option value="">{t("— Actions —")}</option>

                                            {selectedGroups.length === 1 && (
                                                <option value="rename">{t("Rename")}</option>
                                            )}

                                            {selectedGroups.length > 0 && (
                                                <option value="delete">{t("Delete")}</option>
                                            )}
                                        </select>
                                    </th>
                                </tr>

                                {/* EN-TÊTES */}
                                <tr>
                                    <th className={styles.th}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={
                                                selectedGroups.length === filteredGroups.length &&
                                                filteredGroups.length > 0
                                            }
                                            onChange={(e) =>
                                                e.target.checked
                                                    ? handleCheckAllGroups()
                                                    : handleUncheckAllGroups()
                                            }
                                        />
                                    </th>
                                    <th className={styles.th}>{t("Group name")}</th>
                                    <th className={styles.th}>{t("Creation date")}</th>
                                    <th className={styles.th}>{t("Last update")}</th>
                                    <th className={styles.th}>{t("Number of forms")}</th>
                                    <th className={styles.th}>{t("Actions")}</th>
                                </tr>
                            </thead>

                            {/* BODY */}
                            <tbody className={styles.scrollableTable}>
                                {filteredGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan="6">{t("No groups")}</td>
                                    </tr>
                                ) : (
                                    filteredGroups.map(group => (
                                        <tr
                                            key={group.id}
                                            onContextMenu={(e) =>
                                                handleRightClickGroup(e, group.id)
                                            }
                                        >
                                            <td className={styles.td}>
                                                <input
                                                    type="checkbox"
                                                    className={styles.checkbox}
                                                    checked={selectedGroups.includes(group.id)}
                                                    onChange={(e) =>
                                                        handleGroupCheckboxChange(
                                                            group.id,
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td className={styles.td}>{group.name}</td>
                                            <td className={styles.td}>
                                                {new Date(group.created_at).toLocaleString()}
                                            </td>
                                            <td className={styles.td}>
                                                {new Date(group.updated_at).toLocaleString()}
                                            </td>
                                            <td className={styles.td}>
                                                {group.formsCount || 0}
                                            </td>

                                            <td className={styles.td}>
                                                <div className={styles.actionWrapper}>
                                                    <button
                                                        className={styles.actionButton}
                                                        onClick={(e) => {
                                                            e.stopPropagation();

                                                            const rect =
                                                                e.currentTarget.getBoundingClientRect();
                                                            const MENU_HEIGHT = 100;

                                                            let y = rect.bottom;
                                                            if (
                                                                y + MENU_HEIGHT >
                                                                window.innerHeight
                                                            ) {
                                                                y =
                                                                    rect.top -
                                                                    MENU_HEIGHT +
                                                                    38;
                                                            }

                                                            setGroupMenuPosition({
                                                                x: rect.left,
                                                                y,
                                                            });

                                                            setOpenGroupMenuId(
                                                                openGroupMenuId === group.id
                                                                    ? null
                                                                    : group.id
                                                            );
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
                    <div onClick={() => navigate(`/form-viewer/${openMenuId}/1?navigation=True`)}>{t('View')}</div>
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
                    <div onClick={() => navigate(`/form-responses/${openMenuId}`)}>{t("Responses")}</div>
                    <div onClick={() => setMoveModal({ open: true, item: { id: [openMenuId] } })}>{t("Move")}</div>
                    <div onClick={() => handleDuplicateForm(openMenuId)}>{t("Duplicate")}</div>
                    <div onClick={() => handleDeleteForm(openMenuId)}>{t("Delete")}</div>
                    <div onClick={() => handleExportForm(openMenuId)}>{t("Export")}</div>
                </div>
            )}
            {openGroupMenuId && (
                <div
                    ref={groupMenuRef}
                    className={styles.actionMenu}
                    style={{ top: groupMenuPosition.y, left: groupMenuPosition.x }}
                >
                    <div onClick={() => handleRenameGroup(openGroupMenuId, groups.find(g => g.id === openGroupMenuId)?.name)}>{t("Rename")}</div>
                    <div onClick={() => handleDeletegroup(openGroupMenuId)}>{t("Delete")}</div>
                </div>
            )}
        </>
    );
};

export default Accueil;