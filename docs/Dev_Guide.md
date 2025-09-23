# Guide pour les développeurs

## Organisation hiérarchique des répertoires et des fichiers
Ci-après est l'organisation hiérarchique des répertoires et fichiers les plus importants de la plateforme.

```
Ptrans/
  | client/ → Application React (interface utilisateur)
  |   | src/
  |   |   | components/ → Composants React réutilisables pour l'interface utilisateur
  |   |   │   │ Modal.js/ → Composant de modale générique avec options de confirmation et fermeture
  |   |   │   │ DeleteResponsesSuccessModal.js/ → Modale spécifique de confirmation après suppression, avec bouton "Fermer"
  |   |   | pages/ → Les differentes pages de la plateforme (chacune composée d'un fichier .js et un fichier .css)
  |   |   |   | accueil/ → La page d'accueil
  |   |   |   | form_editor/ → La page d'édition de formulaires (s'adapte dynamiquement en fonction de l'URL utilisé pour y accéder, s'il ne contient pas un id de formulaire -> elle permet de créer un nouveau form, si elle contient un id d'un form -> elle permet la modification du form correspondant)
  |   |   |   | form_viewer/ → La page de consultation de formulaires (s'adapte dynamiquement en fonction de l'URL utilisé pour y accéder, s'il contient un id de participant on se retrouve avec la vue participant avec l'auto-sauvegarde activé, sinon on se retrouve avec la vue experimentateur)
  |   |   |   | FormResponsesList/ → La page de la liste des réponses des participants à un formulaire
  |   |   |   | merci/ → La page qui s'affiche lorsque le participant clique sur le bouton "submit" après avoir rempli une page du formulaire
  | serveur/ → Application Express.js (API backend + base de données SQLite)
  |   | base_de_donnee/
  |   |   | bd.db/ → Contient les enregistrements de chaque table de la BDD
  |   |   | bd.sql/ → Creation des tables de la BDD
  |   |   | db.js/ 
  |   |   | initDb.js/ → Initialise la base de données SQLite et exécute les requêtes de bd.sql
  |   | controllers/ → Voir la partie API Routes ci-dessous
  |   | routes/ → Voir la partie API Routes ci-dessous
  |   | services/ → Voir la partie API Routes ci-dessous
  | Dev_Guide.md/ → Description de l'organisation des fichiers, de la base de données, des API et des évolutions possibles 
  | User_Guide.md/ → Description de l'interface utilisateur et des scénarios d'utilisation

```

## Base de Données

La base de données de la plateforme contient `quatre tables` :
* Une table `forms`, dans laquelle sont enregistrés les différents formulaires créés, chacun possède un identifiant unique, un titre, une date et une heure de création, une date et une heure de dernière modification, ainsi qu’un schéma JSON contenant sa structure et permettant de le générer.
* Une table `components`, contenant les différents composants (ou widgets) formant chaque formulaire. Un composant possède un identifiant unique, est associé à un formulaire spécifique grâce à une clé étrangère form_id, dispose d’un label, d’un type, d’une action (par exemple submit dans le cas d’un bouton), d’un key_name et d’un layout (indiquant sa mise en page et sa position dans le formulaire).
* Une table `responses`, dans laquelle sont enregistrées les réponses des participants aux différentes questions des formulaires. Une réponse est associée à un identifiant unique, à un formulaire spécifique grâce à une clé étrangère form_id, à un composant spécifique grâce à une clé étrangère component_id, à un participant spécifique grâce à une clé étrangère user_id. Elle possède également une valeur (la réponse saisie ou sélectionnée) et une date et une heure d’enregistrement.
* Une table `settings`, dans laquelle est enregistré l’id du participant par défaut.

Ci-après est le diagramme entité-relation de la base de données de la plateforme.

<img src="Guide Images/Capturebdd.JPG" width="250"/>


Une notion fondamentale introduite par la librairie form.js, utilisée pour l’implémentation de la plateforme, et sur laquelle nous nous basons pour sauvegarder les formulaires créés et les générer après leur création, est celle du schéma JSON du formulaire.

Ce schéma est une représentation du formulaire, de ses composants, de leur mise en page (ainsi que de leurs identifiants), sous format JSON, selon la structure suivante :
    
```bash
{"components":[

    {"label":"Textfield","type":"textfield","layout"{"row":"Row_0txg27r","columns":null},"id":"Field_070s0b2","key":"textfield_rocwla"},
    {"label":"Number","type":"number","layout":{"row":"Row_046itkl","columns":null},"id":"Field_0g8xpov","key":"number_bhp49i"},
    {"label":"Textarea","type":"textarea","layout":{"row":"Row_046itkl","columns":null},"id":"Field_1idcu8b","key":"textarea_sn0qj"},
    {"label":"Button","action":"submit","type":"button","layout":{"row":"Row_0dlsesg","columns":null},"id":"Field_1y62q4z"},
    {"type":"separator","layout":{"row":"Row_0sbjd66","columns":null},"id":"Field_1y0ijgl"},
    {"subtype":"date","dateLabel":"Date","type":"datetime","layout":{"row":"Row_112rraf","columns":null},"id":"Field_0q64yj7","key":"datetime_2gl9m"},
    {"label":"Number","type":"number","layout":{"row":"Row_0dqxbe4","columns":null},"id":"Field_0xzw87z","key":"number_a7hz8"},
    {"label":"Button","action":"submit","type":"button","layout":{"row":"Row_0lckcsx","columns":null},"id":"Field_16mmdtg"}],
    
    "type":"default","id":"Form_1ptsvm8","schemaVersion":18}
```

## API Routes (Backend)

### Organisation du code 

L’implémentation back-end est organisée en plusieurs couches pour assurer la modularité et la maintenabilité :

- `routes/` : contient tous les points d'entrée HTTP (API REST), organisés par fonctionnalité.
- `controllers/`: traite la logique métier liée à chaque route.
- `services/` : effectue les interactions directes avec la base de données SQLite.
- `database/` : gère la création et l’ouverture de la base bd.db, ainsi que l’initialisation automatique des tables à partir du script bd.sql.

### Routes Formulaires 


| Méthode | URL                         | Description                                 |
|:--------|:----------------------------|:--------------------------------------------|
| `POST`  | `/api/save-form`             | Enregistrer un nouveau formulaire |
| `GET`   | `/api/forms`                 | Récupérer la liste de tous les formulaires |
| `GET`   | `/api/forms/:id`             | Récupérer un formulaire spécifique par ID |
| `GET`   | `/api/forms/:id/has-responses`| Vérifier si un formulaire a déjà des réponses |
| `PUT`   | `/api/forms/:id`             | Mettre à jour un formulaire existant |
| `DELETE`| `/api/forms/:id`             | Supprimer un formulaire (et ses réponses associées) |
| `POST`  | `/api/forms/:id/duplicate`   | Dupliquer un formulaire existant |

### Routes Utilsateur (responses)

| Méthode | URL                                         | Description |
|:--------|:--------------------------------------------|:------------|
| `POST`  | `/api/submit-form`                          | Soumettre toutes les réponses d'un formulaire en une seule fois |
| `POST`  | `/api/save-response`                        | Sauvegarder une réponse individuelle (auto-save champ par champ) |
| `GET`   | `/api/forms/:id/responses`                  | Récupérer toutes les réponses pour un formulaire |
| `GET`   | `/api/form-responses-participant/:form_id/:user_id` | Récupérer toutes les réponses d'un participant spécifique pour un formulaire |
| `DELETE`| `/api/forms/:id/responses`                  | Supprimer toutes les réponses d'un formulaire (sans supprimer le formulaire lui-même) |


### Routes Settings

| Méthode | URL                                         | Description |
|:--------|:--------------------------------------------|:------------|
| `POST`  | `/api/default-user-id`                          | Enregistrer un nouveau id participant par défaut |
| `GET`  | `/api/default-user-id`                        | Récupérer l'id participant par défaut |


## Évolution potentielle des besoins

- Le client peut envisager l'intégration de la plateforme web dans l’outil openSource
OpenSesame via un plugin développé spécifiquement pour cette configuration. Ce
plugin permettra d’accéder aux fonctionnalités de cette plateforme directement
depuis OpenSesame, offrant ainsi une interaction fluide entre les deux systèmes.

- Le client a exprimé son souhait que la plateforme intègre une fonctionnalité
permettant de visualiser les réponses des participants sous forme de graphiques, afin de faciliter l’identification des liens de corrélation entre les réponses des participants en fonction de différents variables (l'âge ou le genre du participant par exemple). 
→ Possibilité d’ajouter des graphiques à la page FormResponsesList/ en utilisant les réponses déjà récupérées pour alimenter la liste des réponses. Pour des graphiques plus avancés, l’utilisation d’une bibliothèque spécialisée en visualisation de données pourrait être nécessaire. 

- Une autre évolution possible serait d’ajouter la fonctionnalité d’authentification, ce
qui permettrait de sécuriser l’accès à la plateforme et aux données qu’elle contient,
en plus de permettre de séparer les formulaires créés par chaque expérimentateur et
les réponses associées. Ainsi, chaque expérimentateur aurait principalement accès
uniquement aux formulaires qu’il a créés (on peut aussi envisager une fonctionnalité de transfert de formulaires d’un expérimentateur à un autre). 
→ La fonctionnalité d’authentification nécessiterait d’ajouter un attribut mot de passe et un attribut email (qui servira d’identifiant unique, plus pratique que l’ID) à la table Expérimentateur. Il faudrait également ajouter la possibilité de créer un compte expérimentateur, ainsi que d’autres fonctionnalités pour gérer ces comptes (modification des attributs, suppression, etc.). Il faut prévoir aussi l'ajout d'une page Authentification/ .

- On pourrait aussi ajouter d’autres paramètres pour les formulaires (en plus de celui de navigation entre les pages d’un formulaire), notamment :
○ un paramètre permettant de changer le thème visuel du formulaire (par
exemple ?theme=dark et ?theme=light),
○ un paramètre permettant d’afficher une barre de progression, utile lorsque
les formulaires sont très longs,
○ ou encore un paramètre permettant de choisir la langue dans laquelle les
questions du formulaire sont rédigées. »

- La librairie Form.js que nous avons utilisée pour l’implémentation de la
plateforme offre la possibilité de créer d’autres composants en plus de ceux déjà
proposés par la librairie. Par exemple, on peut développer un composant input range, ou encore un composant permettant aux utilisateurs de téléverser un fichier. Il est également possible de créer des composants qui permettent de visualiser des données directement dans le formulaire, par exemple sous forme de graphiques, de courbes ou d’autres représentations visuelles adaptées au contexte du formulaire. Enfin, il est possible d’étendre le panneau de propriétés avec des entrées personnalisées, afin de configurer encore plus finement le comportement des différents composants.
Voici un lien vers la documentation de la librairie form.js spécifiant la façon d'implémenter cela : https://bpmn.io/blog/posts/2023-custom-form-components 
