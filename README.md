# Installation et Exécution du Projet

## Prérequis
Avant de commencer, assurez-vous d'avoir installé :
- [Node.js](https://nodejs.org/) (dernière version recommandée)
- [npm](https://www.npmjs.com/) (installé avec Node.js)
- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/) pour utiliser la base de données facilement

## Installation

### 1. Installation du Frontend (Client)
```sh
cd client
npm install
```

### 2. Installation du Backend (Serveur)
```sh
cd serveur
npm install
```

### 3. Configuration et Lancement de la Base de Données avec Docker
Si vous utilisez Docker, vous pouvez créer et lancer votre base de données PostgreSQL facilement avec :
```sh
docker-compose up -d
```
Cela va démarrer un conteneur PostgreSQL avec un volume pour conserver les données.

## Exécution du Projet

### 1. Démarrer le Frontend
Dans le dossier `client`, exécutez :
```sh
npm run start
```

### 2. Démarrer le Backend
Dans le dossier `serveur`, exécutez :
```sh
npm run dev
```

Le projet sera alors accessible sur les ports définis dans votre configuration.

## Notes
- Assurez-vous que votre base de données est bien configurée avant de lancer le backend.
- Si vous utilisez Docker, PostgreSQL sera automatiquement configuré.
- Si vous rencontrez des erreurs, vérifiez que toutes les dépendances sont bien installées et que les fichiers de configuration sont corrects.

