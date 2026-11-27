import React, { useEffect, useState, useRef } from 'react';
import styles from './accueil.module.css'; // Import CSS Module
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import ImportModal from '../../components/ImportModal';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next'; // Ajout i18n

// Page d'accueil : liste des formulaires et des groupes, avec toutes les actions
// (voir, modifier, déplacer, dupliquer, supprimer, exporter, importer...)
const Accueil = () => {
    const { t, i18n } = useTranslation(); // Ajout i18n

    // --- Données principales ---
    const [forms, setForms] = useState([]);
    const [selectedForms, setSelectedForms] = useState([]); // ids des formulaires cochés
    const [newUserId, setNewUserId] = useState(localStorage.getItem('defaultUserId') || ""); // Utiliser la valeur du localStorage ou une valeur vide

    // --- Modales et notifications ---
    // Modale générique (confirmation de suppression, export...)
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: null, confirm: '', close: '', onClose: null });
    // Modale d'import (zip de formulaires)
    const [importModal, setImportModal] = useState({ isOpen: false, onConfirm: null, onFormatError: null, onError: null });
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate(); // Permet de gérer la navigation

    // --- Groupes ---
    const [groups, setgroups] = useState([]);
    // Groupe sélectionné dans le filtre du tableau (mémorisé entre deux visites)
    const [tableSelectedGroup, setTableSelectedGroup] = useState(
        () => localStorage.getItem('selectedGroup') || ""
    );
    // Modale "Déplacer vers un groupe"
    const [moveModal, setMoveModal] = useState({ open: false, type: null, item: null, selectedGroup: "" });

    // --- Recherche, menus contextuels et affichage ---
    const [searchQuery, setSearchQuery] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null); // formulaire dont le menu "..." est ouvert
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState("forms"); // "forms" ou "groups"
    const menuRef = useRef(null);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [openGroupMenuId, setOpenGroupMenuId] = useState(null); // groupe dont le menu est ouvert
    const [groupMenuPosition, setGroupMenuPosition] = useState({ x: 0, y: 0 });
    const groupMenuRef = useRef(null);
    const [groupSearchQuery, setGroupSearchQuery] = useState("");

    // Touche Échap : ferme la modale ouverte (import ou générique)
    document.onkeydown = function (evt) {
        if (evt.keyCode === 27) {
            if (importModal.isOpen === true) {
                closeImportModal();
            }
            if (modal.isOpen === true) {
                closeModal();
            }
        }
    };

    // Formulaires affichés : filtrés par groupe puis par texte de recherche
    const filteredForms = forms
        .filter(f => tableSelectedGroup ? f.group_id === Number(tableSelectedGroup) : true)
        .filter(f => f.title.toLowerCase().includes(searchQuery.toLowerCase()));

    // Groupes affichés : filtrés par texte de recherche
    const filteredGroups = groups
        .filter(g => g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()));

    // Ouvre la modale générique (par défaut : boutons Confirmer / Annuler)
    const showModal = (title, message, onConfirm = null, confirm = 'Confirmer', close = 'Annuler', onClose = closeModal) => {
        setModal({ isOpen: true, title, message, onConfirm, confirm, close, onClose });
    };

    // Ferme la modale générique et remet tout à zéro
    const closeModal = () => {
        setModal({ isOpen: false, title: "", message: "", onConfirm: null, confirm: '', close: '', onClose: null });
    };

    // Ouvre la modale d'import avec les callbacks à appeler (succès, mauvais format, erreur)
    const showImportModal = (onConfirm = null, onFormatError = null, onError = null) => {
        setImportModal({ isOpen: true, onConfirm, onFormatError, onError });
    };

    const closeImportModal = () => {
        setImportModal({ isOpen: false, onConfirm: null, onFormatError: null, onError: null });
    };

    // Récupère les formulaires, puis le nombre de réponses de chacun
    const fetchForms = async () => {
        try {
            const response = await fetch('/api/forms');
            if (!response.ok) throw new Error('Erreur lors du chargement des formulaires');
            const data = await response.json();
            // Une requête par formulaire pour compter ses réponses
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

    // Affiche une petite notification qui disparaît toute seule après "duration" ms
    const showNotification = (message, type = "success", duration = 3000) => {
        const id = Date.now() + Math.random(); // id unique pour pouvoir la retirer ensuite
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration);
    };

    // Recharge la liste des formulaires (même logique que fetchForms)
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

    // Recharge les groupes avec le nombre de formulaires de chacun
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

    // Au premier affichage : on charge les formulaires et les groupes
    useEffect(() => {
        reloadForms();
        reloadgroups();
    }, []);

    // Ferme les menus "..." quand on clique en dehors
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

        // Nettoyage : on retire l'écouteur quand le composant change ou disparaît
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openMenuId, openGroupMenuId]);

    // Modifier un formulaire : interdit s'il contient déjà des réponses
    const handleEditForm = async (formId) => {
        try {
            const response = await fetch(`/api/forms/${formId}/has-responses`);
            const data = await response.json();

            if (data.hasResponses) {
                showNotification("Attention, ce formulaire contient déjà des réponses et ne peut pas être modifié.", "error");
            } else {
                navigate(`/form-editor2/${formId}`);
            }
        } catch (error) {
            console.error("Erreur lors de la vérification des réponses :", error);
            showNotification("Erreur lors de la vérification des réponses.", "error");
        }
    };

    // Exporte un ou plusieurs formulaires dans un zip (un fichier JSON par formulaire)
    const handleExportForm = async (formId) => {
        let JSZip = require("jszip");

        // On accepte un id, une liste d'ids, ou à défaut les formulaires cochés
        const ids = formId ? (Array.isArray(formId) ? formId : [formId]) : selectedForms;

        if (!ids || ids.length === 0) return;

        // Fabrique le zip et lance le téléchargement
        const DownloadExport = async (jsonExport) => {

            let zip = new JSZip();
            let ladate = new Date();
            for (const form in jsonExport) {
                zip.file(jsonExport[form].title + '.json', JSON.stringify(jsonExport[form], null, 2));
            }
            zip.generateAsync({ type: "blob" })
                .then(function (content) {
                    // Nom du zip : date + nombre de formulaires (singulier ou pluriel)
                    if (Object.keys(jsonExport).length === 1) {
                        saveAs(content, ladate.toISOString().substring(0, 10) + "_export_de_" + Object.keys(jsonExport).length + "_formulaire.zip");
                    }
                    else {
                        saveAs(content, ladate.toISOString().substring(0, 10) + "_export_de_" + Object.keys(jsonExport).length + "_formulaires.zip");
                    }
                });

            closeModal();
            showNotification(t("Form exported!"), "success");

        };

        // Récupère chaque formulaire depuis l'API (avec ou sans ses réponses selon "resp")
        const exportForm = async (ids, resp = false) => {

            let jsonExport = {};

            for (let i = 0; i < ids.length; i++) {
                let id = ids[i];
                try {
                    const response = await fetch(`/api/forms/${id}/export/${resp}`);

                    if (response.ok) {

                        const formJson = await response.json();

                        jsonExport[i + 1] = formJson;

                    } else {
                        const errorData = await response.json();
                        showNotification("Erreur : " + errorData.error, "error");
                    }
                } catch (error) {
                    console.error("Erreur :", error);
                    showNotification("Impossible de contacter le serveur.", "error");
                }
            }

            DownloadExport(jsonExport);
        }

        // On demande d'abord si les réponses doivent être exportées aussi
        // Oui -> exportForm(ids, true) ; Non -> exportForm(ids)
        showModal(t('Export'), t('Do you also want to export the responses?'), () => { exportForm(ids, true) }, 'Yes', 'No', () => { exportForm(ids) });
    };

    // Exporte les réponses des formulaires en CSV (un fichier par formulaire, le tout dans un zip)
    const handleExportFormDatas = async (formId) => {
        let JSZip = require("jszip");
        const ids = formId ? (Array.isArray(formId) ? formId : [formId]) : selectedForms;

        if (!ids || ids.length === 0) return;

        let zip = new JSZip();

        for (let i = 0; i < ids.length; i++) {

            let id = ids[i];

            try {

                const response = await fetch(`/api/forms/${id}/responses`);
                if (!response.ok) throw new Error(t("Error loading responses"));

                const data = await response.json();

                // On liste toutes les questions rencontrées (sans doublons) pour faire les colonnes
                const extractedQuestions = [];

                data.forEach((userResponse) => {
                    userResponse.responses.forEach((resp) => {
                        if (!extractedQuestions.includes(resp.question)) {
                            extractedQuestions.push(resp.question);
                        }
                    });
                });

                const questions = extractedQuestions;
                const responses = data;

                // Ligne d'en-tête : ID utilisateur puis une colonne par question
                const headers = [t("User ID"), ...questions];
                // Une ligne par participant, "N/A" quand il n'a pas répondu à une question
                const rows = responses.map((userResponse) => {
                    const row = [userResponse.user_id];
                    questions.forEach((question) => {
                        const answerObj = userResponse.responses.find((resp) => resp.question === question);
                        row.push(answerObj ? answerObj.answer || t("N/A") : t("N/A"));
                    });
                    return row;
                });

                // Construction du CSV : chaque cellule entre guillemets, séparées par des virgules
                const csvContent = [headers, ...rows]
                    .map((row) => row.map((cell) => `"${cell}"`).join(","))
                    .join("\n");

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                // On récupère le titre du formulaire pour nommer le fichier
                const form = await fetch(`/api/forms/${id}`);
                const formData = await form.json();
                const formTitle = formData.title;
                // On remplace les caractères spéciaux par "_" pour avoir un nom de fichier propre
                const title = formTitle.replace(/[^a-z0-9_-]/gi, "_");


                zip.file(title + '.csv', blob);

            }
            catch {
                showNotification('Impossible de contacter le serveur', 'error');
            }

        }

        // Téléchargement du zip contenant tous les CSV
        zip.generateAsync({ type: "blob" })
            .then(function (content) {
                saveAs(content, "Reponses_formulaires.zip");
            });

    }

    // Supprime uniquement les réponses (pas les formulaires), après confirmation
    const handleDeleteFormDatas = async (formId) => {

        const ids = formId ? (Array.isArray(formId) ? formId : [formId]) : selectedForms;

        if (!ids || ids.length === 0) return;

        showModal(
            t("Delete"),
            t("DeleteResponses") + ` ${ids.length} ` + t("form") + (ids.length > 1 ? 's' : '') + `? ` + t("This action is irreversible."),
            async () => {
                try {
                    closeModal();
                    for (const id of ids) {
                        await fetch(`/api/forms/${id}/responses`, { method: "DELETE" });
                    }
                    showNotification("Les réponses sont supprimées", "success");

                    // On rafraîchit les compteurs et on vide la sélection
                    await reloadForms();
                    await reloadgroups();
                    setSelectedForms([]);
                } catch (error) {
                    console.error(error);
                    showNotification("Impossible de contacter le serveur", "error");
                }
            },
            "Confirm",
            "Close"
        );

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

            showNotification(t("Default user ID saved!"), "success");
        } catch (error) {
            console.error(error);
            showNotification(t("Unable to save default user ID."), "error");
        }
    };

    // Affiche ou non les boutons pour tout dupliquer/supprimer
    // Coche ou décoche un formulaire dans la sélection
    const handleCheckboxChange = (formId, checked) => {
        if (checked) {
            setSelectedForms(prev => [...prev, formId]);
        } else {
            setSelectedForms(prev => prev.filter(id => id !== formId));
        }
    };

    // Tout cocher (uniquement les formulaires visibles après filtrage)
    const handleCheckAll = () => {
        const allIds = filteredForms.map(form => form.id);
        setSelectedForms(allIds);
    };

    // Tout décocher
    const handleUncheckAll = () => {
        setSelectedForms([]);
    };

    // Pareil pour les groupes
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

            showNotification(t("All selected forms have been duplicated!"), "success");

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

        // On demande confirmation avant de supprimer quoi que ce soit
        showModal(
            t("Delete"),
            t("Delete") + ` ${ids.length} ` + t("form") + (ids.length > 1 ? 's' : '') + `? ` + t("This action is irreversible."),
            async () => {
                try {
                    closeModal();
                    for (const id of ids) {
                        await fetch(`/api/forms/${id}`, { method: "DELETE" });
                    }
                    showNotification(t("All forms have been deleted."), "success");

                    await reloadForms();
                    await reloadgroups();
                    setSelectedForms([]); // Nettoyage
                } catch (error) {
                    console.error(error);
                    showNotification(t("Unable to delete some forms."), "error");
                }
            },
            "Confirm",
            "Close"
        );
    };

    // Crée un nouveau groupe (le nom est demandé avec un prompt du navigateur)
    const creategroup = () => {
        let groupName = prompt("Nom du nouveau groupe :");

        // Nom vide ou annulation : on ne fait rien
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

    // Déplace les formulaires choisis vers le groupe sélectionné dans la modale
    const handleMove = async () => {
        if (!moveModal.selectedGroup) return;

        const itemsToMove = Array.isArray(moveModal.item.id) ? moveModal.item.id : [moveModal.item.id];

        for (const id of itemsToMove) {
            // "none" = retirer le formulaire de son groupe
            const groupId = moveModal.selectedGroup === "none" ? null : moveModal.selectedGroup;
            await fetch(`/api/forms/${id}/move-to-group/${groupId}`, {
                method: "PUT",
            });
        }
        showNotification(`Formulaire(s) déplacé(s)`, "success");

        setMoveModal({ open: false, item: null, selectedGroup: "" });
        setSelectedForms([]);

        await reloadForms();
        await reloadgroups();
    };

    // Renomme un groupe (nouveau nom demandé avec un prompt)
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
            showNotification(t("Group renamed to") + ` "${newName}"`, "success");

        } catch (err) {
            console.error(err);
            showNotification(t("Unable to rename group"), "error");
        }
    };


    // Supprime un groupe après confirmation
    const handleDeletegroup = (groupId) => {
        showModal(
            t("Delete"),
            t("Delete") + ` ${groups.find(g => g.id === groupId)?.name} ? ` + t("This action is irreversible."),
            async () => {
                try {
                    closeModal();
                    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });

                    reloadgroups();
                    reloadForms();
                    setSelectedForms([]);
                    showNotification(t("Group(s) deleted"), "success");

                } catch (err) {
                    console.error(err);
                    showNotification(t("Unable to delete group"), "error");
                }

            }
        );
    };

    // Clic droit sur une ligne de formulaire : ouvre le menu d'actions à l'endroit du clic
    const handleRightClick = (e, id) => {
        e.preventDefault(); // on bloque le menu du navigateur
        e.stopPropagation();

        const MENU_HEIGHT = 220;

        let y = e.clientY;

        // Si le menu dépasse en bas de l'écran, on le remonte
        if (y + MENU_HEIGHT > window.innerHeight) {
            y = y - MENU_HEIGHT + 38;
        }

        setMenuPosition({
            x: e.clientX,
            y,
        });

        setOpenMenuId(id);
    };

    // Coche ou décoche un groupe dans la sélection
    const handleGroupCheckboxChange = (groupId, checked) => {
        if (checked) setSelectedGroups(prev => [...prev, groupId]);
        else setSelectedGroups(prev => prev.filter(id => id !== groupId));
    };

    // Clic droit sur une ligne de groupe : même principe que pour les formulaires
    const handleRightClickGroup = (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        const MENU_HEIGHT = 100; // Hauteur du menu actions groupes
        let y = e.clientY;
        if (y + MENU_HEIGHT > window.innerHeight) y = y - MENU_HEIGHT + 32;

        setGroupMenuPosition({ x: e.clientX, y });
        setOpenGroupMenuId(id);
    };


    // Ouvre la modale d'import et définit quoi faire selon le résultat
    const handleImportButton = () => {
        showImportModal(() => {
            // Succès : on ferme la modale, on recharge la liste et on prévient
            closeImportModal();
            fetchForms();
            showNotification("Formulaires importés !", "success");
        },
            (fileName) => {
                // Un fichier du zip n'a pas le bon format
                showNotification(`Contenu du fichier incompatible : ${fileName}`, "error");
            },
            () => {
                // Erreur générale (serveur injoignable...)
                //closeImportModal();
                fetchForms();
                showNotification("Impossible de contacter le serveur.", "error");
            });
    }



    return (
        <>
            {/* Langue en haut à droite dans le flux */}
            {/* Barre du haut : titre, bascule Formulaires/Groupes, choix de la langue */}
            <div className={styles.topBar}>
                <h1 className={styles.topBarLeft}>{t('welcome')}</h1>
                <div className={styles.topBarCenter}>
                    <div className={styles.displayType}>
                        <button
                            onClick={() => { setViewMode("forms"); handleUncheckAll(); }}
                            className={`${styles.viewButton} ${viewMode === "forms" ? styles.activeViewButton : ""} ${styles.switchToViewForms}`}
                        >
                            {t('Forms')}
                        </button>
                        <button
                            onClick={() => { setViewMode("groups"); handleUncheckAllGroups(); }}
                            className={`${styles.viewButton} ${viewMode === "groups" ? styles.activeViewButton : ""} ${styles.switchToViewGroups}`}
                        >
                            {t('Groups')}
                        </button>
                    </div>
                </div>
                <div className={styles.topBarRight}>
                    {/* Changement de langue, mémorisé dans le localStorage */}
                    <select
                        className={styles.langSelect}
                        value={i18n.language}
                        onChange={e => { i18n.changeLanguage(e.target.value); localStorage.setItem('lang', e.target.value); }}
                    >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>
            {/* Modale générique (confirmations) */}
            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onClose={modal.onClose}
                onConfirm={modal.onConfirm}
                confirm={modal.confirm}
                close={modal.close}
            />
            {/* Modale d'import de formulaires */}
            <ImportModal
                isOpen={importModal.isOpen}
                onConfirm={importModal.onConfirm}
                onClose={closeImportModal}
                onFormatError={importModal.onFormatError}
                onError={importModal.onError}
            />
            {/* Notifications empilées (succès / erreur) */}
            <div className={styles.notificationsContainer}>
                {notifications.map(n => (
                    <div key={n.id} className={`${styles.notification} ${styles[n.type]}`}>
                        {n.message}
                    </div>
                ))}
            </div>
            {/* Modale "Déplacer vers..." : choix du groupe de destination */}
            {moveModal.open && (
                <div className={styles.moveModalOverlay}>
                    <div className={styles.moveModalContent}>
                        <h3>{t("Move to...")}</h3>

                        <select
                            value={moveModal.selectedGroup}
                            onChange={(e) => setMoveModal(prev => ({ ...prev, selectedGroup: e.target.value }))}
                        >
                            <option value="">{t("Select a group")}</option>
                            <option value="none">📁 {t("no group")}</option>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>
                                    📁 {group.name}
                                </option>
                            ))}
                        </select>

                        <div className={styles.buttonsRow}>
                            {/* Désactivé tant qu'aucun groupe n'est choisi */}
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
            {/* Contenu principal : vue Formulaires ou vue Groupes */}
            {viewMode === "forms" ? (
                // ===== VUE FORMULAIRES =====
                <div className={styles.container}>
                    <div className={styles.tableHeader}>
                        {/* ID participant par défaut, sauvegardé côté serveur */}
                        <div className={styles.defaultUserIdContainer}>
                            <label htmlFor="defaultUserId" className={styles.defaultUserIdLabel}>
                                {t('Default participant ID:')}
                            </label>
                            <input
                                id="defaultUserId"
                                type="text"
                                value={newUserId}
                                onChange={handleDefaultUserIdChange}
                                className={styles.defaultUserIdInput}
                            />
                            <button onClick={handleSaveDefaultUserId} className={styles.saveButton}>
                                {t('Save')}
                            </button>
                        </div>
                        <h2 className={styles.tableTitle}>{t('List of saved forms')}</h2>
                        <div className={styles.createButtonContainer}>
                            <button
                                className={styles.importButton}
                                onClick={() => handleImportButton()}
                            >
                                {t('Import')}
                            </button>
                            <button
                                className={styles.createButton}
                                onClick={() => navigate("/form-editor2")}
                            >
                                {t('Create')}
                            </button>
                        </div>
                    </div>
                    <div className={styles.tableContainer}>
                        <div>
                            <table className={styles.table}>
                                <thead className='thead'>
                                    {/* Ligne des filtres : recherche, groupe, actions multiples */}
                                    <tr className={styles.filtrers}>
                                        <th className={styles.thFilter}></th>
                                        <th className={styles.thFilter}>
                                            <input
                                                type="text"
                                                placeholder={t('Search a form...')}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className={styles.headerSearchInput}
                                            />
                                        </th>
                                        <th className={styles.thFilter}>
                                            {/* Filtre par groupe, mémorisé dans le localStorage */}
                                            <select
                                                value={tableSelectedGroup}
                                                onChange={(e) => {
                                                    setTableSelectedGroup(e.target.value);
                                                    localStorage.setItem('selectedGroup', e.target.value);
                                                }}
                                            >
                                                <option value="">{t('All groups') || 'Tous les groupes'}</option>
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
                                            {/* Menu d'actions sur les formulaires cochés */}
                                            <select
                                                value=""
                                                disabled={selectedForms.length === 0}
                                                onChange={(e) => {
                                                    const action = e.target.value;
                                                    e.target.value = ""; // on remet le menu sur "— Actions —"
                                                    if (!action) return;

                                                    const isMultiple = selectedForms.length > 1;
                                                    const id = selectedForms;

                                                    // Voir / modifier / réponses : uniquement si un seul formulaire est coché
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
                                                        case "exportDatas":
                                                            handleExportFormDatas(id);
                                                            break;
                                                        case "deleteDatas":
                                                            handleDeleteFormDatas(id);
                                                            break;
                                                        default:
                                                            break;
                                                    }
                                                }}
                                                className={`${styles.headerSelect} ${selectedForms.length === 0 ? styles.selectDisabled : styles.selectEnabled
                                                    }`}
                                            >
                                                <option value="">{t('— Actions —')}</option>

                                                {/* Actions disponibles seulement avec une sélection unique */}
                                                {selectedForms.length === 1 && (
                                                    <>
                                                        <option value="view">{t('View')}</option>
                                                        {/* Modifier est grisé si le formulaire a déjà des réponses */}
                                                        <option
                                                            value="edit"
                                                            disabled={
                                                                forms.find(f => f.id === selectedForms[0])?.responseCount > 0
                                                            }
                                                        >
                                                            {t('Edit')}
                                                        </option>
                                                        <option value="responses">{t('View responses')}</option>
                                                    </>
                                                )}

                                                {/* Actions disponibles dès qu'au moins un formulaire est coché */}
                                                {selectedForms.length > 0 && (
                                                    <>
                                                        <option value="move">{t('Move')}</option>
                                                        <option value="duplicate">{t('Duplicate')}</option>
                                                        <option value="delete">{t('Delete')}</option>
                                                        <option value="export">{t('Export')}</option>
                                                        <option value="exportDatas">{t("ExportDatas")}</option>
                                                        <option value="deleteDatas">{t("DeleteDatas")}</option>
                                                    </>
                                                )}
                                            </select>
                                        </th>
                                    </tr>
                                    {/* Ligne des en-têtes de colonnes */}
                                    <tr>
                                        <th className={styles.th}>
                                            {/* Case "tout cocher" */}
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
                                        <th className={styles.th}>{t('Title')}</th>
                                        <th className={styles.th}>{t('Group')}</th>
                                        <th className={styles.th}>{t('Creation date')}</th>
                                        <th className={styles.th}>{t('Last update')}</th>
                                        <th className={styles.th}>{t('Number of responses')}</th>
                                        <th className={styles.th}>{t('Actions')}</th>
                                    </tr>
                                </thead>

                                <tbody className={styles.scrollableTable}>
                                    {forms.length === 0 ? (
                                        <tr>
                                            <td colSpan="7">{t('No forms')}</td>
                                        </tr>
                                    ) : (
                                        filteredForms.map(form => (
                                            // Clic droit sur la ligne : menu d'actions
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
                                                        {/* Bouton "..." : ouvre le même menu que le clic droit,
                                                            placé juste sous le bouton (ou au-dessus s'il manque de la place) */}
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

                                                                // Un deuxième clic sur le même bouton referme le menu
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
                // ===== VUE GROUPES =====
                <div className={styles.container}>
                    <div className={styles.tableHeader}>
                        <div className={styles.defaultUserIdContainer}>
                            <label htmlFor="defaultUserId" className={styles.defaultUserIdLabel}>
                                {t('Default participant ID:')}
                            </label>
                            <input
                                id="defaultUserId"
                                type="text"
                                value={newUserId}
                                onChange={handleDefaultUserIdChange}
                                className={styles.defaultUserIdInput}
                            />
                            <button onClick={handleSaveDefaultUserId} className={styles.saveButton}>
                                {t('Save')}
                            </button>
                        </div>
                        <h2 className={styles.tableTitle}>{t('List of saved groups')}</h2>
                        <div className={styles.createButtonContainer}>
                            <button
                                className={styles.createButton}
                                onClick={() => creategroup()}
                            >
                                {t('Create')}
                            </button>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                {/* Ligne des filtres : recherche de groupe et actions multiples */}
                                <tr className={styles.filtrers}>
                                    <th className={styles.thFilter}></th>

                                    <th className={styles.thFilter}>
                                        <input
                                            type="text"
                                            placeholder={t('Search a group...')}
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
                                            className={`${styles.headerSelect} ${selectedGroups.length === 0
                                                ? styles.selectDisabled
                                                : styles.selectEnabled
                                                }`}
                                        >
                                            <option value="">— Actions —</option>

                                            {/* Renommer : seulement si un seul groupe est coché */}
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
                                        {/* Case "tout cocher" pour les groupes */}
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
                                    <th className={styles.th}>{t("Title")}</th>
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
                                        <td colSpan="6">{t('No groups')}</td>
                                    </tr>
                                ) : (
                                    filteredGroups.map(group => (
                                        // Clic droit sur la ligne : menu d'actions du groupe
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
                                                    {/* Bouton "..." : ouvre le menu du groupe sous le bouton */}
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
            {/* Menu contextuel d'un formulaire (clic droit ou bouton "...") */}
            {openMenuId && (
                <div
                    ref={menuRef}
                    className={styles.actionMenu}
                    style={{
                        top: menuPosition.y,
                        left: menuPosition.x,
                        transform: "translateX(-40%)",
                    }}
                >
                    <div onClick={() => navigate(`/form-viewer/${openMenuId}/1?navigation=True`)}>{t('View')}</div>
                    {/* Modifier : grisé si le formulaire a déjà des réponses */}
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
                                {t('Edit')}
                            </div>
                        );
                    })()}
                    <div onClick={() => navigate(`/form-responses/${openMenuId}`)}>{t('View responses')}</div>
                    <div onClick={() => setMoveModal({ open: true, item: { id: [openMenuId] } })}>{t('Move')}</div>
                    <div onClick={() => handleDuplicateForm(openMenuId)}>{t('Duplicate')}</div>
                    <div onClick={() => handleDeleteForm(openMenuId)}>{t('Delete')}</div>
                    <div onClick={() => handleExportForm(openMenuId)}>{t('Export')}</div>
                    {/* Export des réponses : grisé s'il n'y en a aucune */}
                    {(() => {
                        const form = forms.find(f => f.id === openMenuId);
                        const disabled = form?.responseCount === 0;

                        return (
                            <div
                                className={disabled ? styles.disabledAction : ""}
                                onClick={() => {
                                    if (!disabled) handleExportFormDatas(openMenuId);
                                }}
                            >
                                {t('ExportDatas')}
                            </div>
                        );
                    })()}
                    {/* Suppression des réponses : grisée s'il n'y en a aucune */}
                    {(() => {
                        const form = forms.find(f => f.id === openMenuId);
                        const disabled = form?.responseCount === 0;

                        return (
                            <div
                                className={disabled ? styles.disabledAction : ""}
                                onClick={() => {
                                    if (!disabled) handleDeleteFormDatas(openMenuId);
                                }}
                            >
                                {t('DeleteDatas')}
                            </div>
                        );
                    })()}
                </div>
            )}
            {/* Menu contextuel d'un groupe : renommer ou supprimer */}
            {openGroupMenuId && (
                <div
                    ref={groupMenuRef}
                    className={styles.actionMenu}
                    style={{ top: groupMenuPosition.y, left: groupMenuPosition.x, transform: "translateX(-40%)", }}
                >
                    <div onClick={() => handleRenameGroup(openGroupMenuId, groups.find(g => g.id === openGroupMenuId)?.name)}>{t('Rename')}</div>
                    <div onClick={() => handleDeletegroup(openGroupMenuId)}>{t('Delete')}</div>
                </div>
            )}
        </>
    );
};

export default Accueil;