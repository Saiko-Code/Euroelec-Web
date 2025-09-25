const mysql = require("mysql");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

db.getConnection((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données :", err);
    process.exit(1);
  } else {
    console.log("✅ Connecté à la base de données MariaDB");
  }
});

module.exports = db;
