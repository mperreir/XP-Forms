-- Table forms
CREATE TABLE forms (
    id TEXT PRIMARY KEY,  -- Form ID
    title TEXT NOT NULL,
    json_data TEXT,  -- Stocke le JSON complet sous forme de texte
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Fonction de mise à jour de `updated_at`
CREATE TRIGGER trigger_update_forms_updated_at
AFTER UPDATE ON forms
FOR EACH ROW
BEGIN
    UPDATE forms SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Table components (clé primaire = id + form_id)
CREATE TABLE components (
    id TEXT NOT NULL,          -- Component ID (non unique globalement)
    form_id TEXT NOT NULL,     -- Formulaire auquel le composant appartient
    label TEXT NOT NULL,
    type TEXT NOT NULL,        -- textfield, textarea, etc.
    action TEXT,
    key_name TEXT,
    layout TEXT,
    PRIMARY KEY (id, form_id),
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Table responses
CREATE TABLE responses (
    id INTEGER PRIMARY KEY,
    form_id TEXT,
    component_id TEXT,
    user_id TEXT,
    value TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    UNIQUE(form_id, component_id, user_id)
);

-- Table settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_groups_updated_at
AFTER UPDATE ON groups
FOR EACH ROW
BEGIN
    UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;