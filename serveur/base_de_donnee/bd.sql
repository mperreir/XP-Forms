-- Table forms
CREATE TABLE forms (
    id TEXT PRIMARY KEY,  -- Form ID
    title TEXT NOT NULL,
    json_data TEXT,  -- Stocke le JSON complet sous forme de texte
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Utilise DATETIME
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fonction de mise à jour de `updated_at`
CREATE TRIGGER trigger_update_forms_updated_at
AFTER UPDATE ON forms
FOR EACH ROW
BEGIN
    UPDATE forms SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Table components
CREATE TABLE components (
    id TEXT PRIMARY KEY,  -- Component ID
    form_id TEXT,
    label TEXT NOT NULL,
    type TEXT NOT NULL,  -- Textfield, textarea, etc.
    action TEXT,
    key_name TEXT,  -- Clé unique du champ dans le JSON
    layout TEXT,  -- Stocke l'organisation sous forme de texte JSON
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Table responses
CREATE TABLE responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Id auto-incrémenté
    form_id TEXT,
    component_id TEXT,
    user_id TEXT,
    value TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
    UNIQUE(form_id, component_id, user_id)
);


/*ALTER TABLE forms ADD COLUMN default_user_id TEXT;*/

