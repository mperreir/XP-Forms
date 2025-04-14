# Étape 1 : Utiliser une image de Node.js officielle pour la construction
FROM node:14 AS build

# Créer un répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json dans le conteneur
COPY package.json package-lock.json /app/

# Installer les dépendances de l'application React
RUN npm install

# Copier tout le code source de l'application dans le conteneur
COPY . /app/

# Construire l'application React pour la production
RUN npm run build

# Étape 2 : Utiliser Nginx pour servir l'application React construite
FROM nginx:alpine

# Copier le build React dans le répertoire de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Exposer le port utilisé par Nginx
EXPOSE 80

# Démarrer Nginx pour servir l'application
CMD ["nginx", "-g", "daemon off;"]
