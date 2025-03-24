const { DataSource } = require("typeorm");
const ormConfig = require("./ormconfig");

const AppDataSource = new DataSource(ormConfig);

AppDataSource.initialize()
  .then(() => {
    console.log("Base de données connectée !");
  })
  .catch((err) => {
    console.error("Erreur de connexion à la base :", err);
  });

module.exports = AppDataSource;
