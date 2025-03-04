# Guide d'utilisation de l'application

## 1. Préparation de la base de données : 
Il faut tout d'abord commencer par créer une nouvelle base de données sur Postgresql que vous appelez `PTrans` (de preference utilisez pgAdmin). Dans cette base de données créez les tables necessaires au fonctionnement de l'application en effectuant les requetes sql çi-après :

__Table forms__ :
```bash
CREATE TABLE forms (
    id VARCHAR(50) PRIMARY KEY,  -- Form ID
    title VARCHAR(255) NOT NULL,
    json_data JSON,  -- Stocker le JSON complet pour référence,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création d'une fonction qui met à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger pour exécuter la fonction lors de la mise à jour
CREATE TRIGGER trigger_update_forms_updated_at
BEFORE UPDATE ON forms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```
__Table components__ :

```bash
CREATE TABLE components (
    id VARCHAR(50) PRIMARY KEY,  -- Component ID
    form_id VARCHAR(50),
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- textfield, textarea, radio, etc.
    action VARCHAR(10),
    key_name VARCHAR(255), -- Clé unique du champ dans le JSON
    layout JSON,  -- Stocke l'organisation dans le formulaire
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);
```
__Table responses__ :

```bash
CREATE TABLE responses (
    id SERIAL PRIMARY KEY,
    form_id VARCHAR(50),
    user_id VARCHAR(50),  -- ID de l'utilisateur qui répond
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);
```
__Table response_values__ :

```bash
CREATE TABLE response_values (
    id SERIAL PRIMARY KEY,
    response_id INT,
    component_id VARCHAR(50),
    value TEXT,  -- Stocke la réponse à la question
    FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
);
```
__Remarque 1__ : À chaque insertion d'un formulaire dans la table forms, il est nécessaire d'insérer ses composants dans la table components, comme implémenté dans la route `app.post('/api/save-form')` dans `serveur.js`.

__Remarque 2__ : Dans le répertoire `serveur`, veuillez modifier le fichier `db.js` en mettant les valeurs de `user`, `password` propres à vous (ceux que vous utilisez sur pgAdmin).


## 2. Installation et Execution :
L'application est composée de deux parties :

### 2.1. Backend : 
Vous trouverez le code correspondant dans le répertoire `serveur`. Nous avons utilisé `Express.js` pour cette partie.

__npm :__ Dans le répertoire `serveur`, exécutez la commande `npm install` pour installer les modules nécessaires à son fonctionnement.

__Execution :__ Dans le répertoire `serveur`, exécutez la commande `npm run dev` pour lancer cette partie de l'application.

### 2.2. Frontend : 
Vous trouverez le code correspondant dans le répertoire `client`. Nous avons utilisé `React` et la bibliothèque `formjs` pour cette partie.

__npm :__ Dans le répertoire `client`, exécutez la commande `npm install` pour installer les modules nécessaires à son fonctionnement.

__Execution :__ Dans le répertoire `client`, exécutez la commande `npm start` pour lancer cette partie de l'application.