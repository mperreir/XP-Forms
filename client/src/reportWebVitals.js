// Mesure les performances de l'application (fichier généré par défaut par Create React App)
// "onPerfEntry" est une fonction fournie par l'appelant, qui reçoit chaque mesure
// (par exemple : reportWebVitals(console.log))
const reportWebVitals = onPerfEntry => {
  // On ne fait rien si aucune fonction n'est fournie
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // La bibliothèque web-vitals est chargée à la demande, pour ne pas alourdir le chargement de l'app
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);  // stabilité visuelle (éléments qui bougent pendant le chargement)
      getFID(onPerfEntry);  // délai avant la première interaction de l'utilisateur
      getFCP(onPerfEntry);  // temps avant le premier contenu affiché
      getLCP(onPerfEntry);  // temps avant le plus gros élément affiché
      getTTFB(onPerfEntry); // temps de réponse du serveur
    });
  }
};

export default reportWebVitals;