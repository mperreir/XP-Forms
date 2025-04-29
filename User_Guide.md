## Architecture du projet
-/client → Application React (interface utilisateur)

-/serveur → Application Express.js (API backend + base de données SQLite)

## Base de Données

Structure principale :

-forms (Formulaires créés)

-components (Champs des formulaires)

-responses (Réponses des utilisateurs)

## API Routes (Backend)

# Routes Formulaires 


| Méthode | URL                         | Description                                 |
|:--------|:----------------------------|:--------------------------------------------|
| `POST`  | `/api/save-form`             | Enregistrer un nouveau formulaire |
| `GET`   | `/api/forms`                 | Récupérer la liste de tous les formulaires |
| `GET`   | `/api/forms/:id`             | Récupérer un formulaire spécifique par ID |
| `GET`   | `/api/forms/:id/has-responses`| Vérifier si un formulaire a déjà des réponses |
| `PUT`   | `/api/forms/:id`             | Mettre à jour un formulaire existant |
| `DELETE`| `/api/forms/:id`             | Supprimer un formulaire (et ses réponses associées) |
| `POST`  | `/api/forms/:id/duplicate`   | Dupliquer un formulaire existant |

# Routes Utilsateur (responses)

| Méthode | URL                                         | Description |
|:--------|:--------------------------------------------|:------------|
| `POST`  | `/api/submit-form`                          | Soumettre toutes les réponses d'un formulaire en une seule fois |
| `POST`  | `/api/save-response`                        | Sauvegarder une réponse individuelle (auto-save champ par champ) |
| `GET`   | `/api/forms/:id/responses`                  | Récupérer toutes les réponses pour un formulaire |
| `GET`   | `/api/form-responses-participant/:form_id/:user_id` | Récupérer toutes les réponses d'un participant spécifique pour un formulaire |
| `DELETE`| `/api/forms/:id/responses`                  | Supprimer toutes les réponses d'un formulaire (sans supprimer le formulaire lui-même) |
