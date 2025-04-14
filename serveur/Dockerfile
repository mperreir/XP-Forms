# Choisir l'image de base Node.js
FROM node:14

# Définir le répertoire de travail à /app
WORKDIR /app

# Copier le package.json et le package-lock.json
COPY package.json package-lock.json /app/

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers de l'application
COPY . /app/

# Exposer le port sur lequel l'app va écouter
EXPOSE 5000

# Démarrer l'application avec nodemon
CMD ["npm", "run", "dev"]
