require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

// Configuration du serveur
const PORT = process.env.REACT_APP_SERVER_PORT
const HOST = process.env.REACT_APP_SERVER_IP

// Importation des middlewares
require("./src/middleware/middleware")(app);

// Connexion à la base de données
const db = require("./src/configs/db");

// Importation des routes
app.use("/temperature", require("./src/routes/temperatureRoutes"));
app.use("/auth", require("./src/routes/userRoutes"));
app.use("/air-program", require("./src/routes/airProgramRoutes"));
app.use("/sensor-groups", require("./src/routes/sensorGroupRoutes"));

// Démarrage du serveur
app.listen(PORT, HOST, () => {
  console.log(`🚀 Serveur en cours d'exécution sur http://${HOST}:${PORT}`);
});
