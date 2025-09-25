const express = require("express");
const router = express.Router();
const db = require("../configs/db");

// 📌 Récupérer toutes les températures
router.get("/", (req, res) => {
  const sql = "SELECT * FROM temperature ORDER BY timestamp DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Erreur SELECT température :", err);
      return res.status(500).json({ status: "error", message: "Erreur serveur." });
    }
    res.json({ status: "success", data: results });
  });
});

// 📌 Ajouter une température
router.post("/", (req, res) => {
  const { sensor_name, value, timestamp } = req.body;

  if (!sensor_name || !value || !timestamp) {
    return res
      .status(400)
      .json({ status: "error", message: "Champs manquants." });
  }

  const sql = "INSERT INTO temperature (sensor_name, value, timestamp) VALUES (?, ?, ?)";
  db.query(sql, [sensor_name, value, timestamp], (err, result) => {
    if (err) {
      console.error("❌ Erreur INSERT température :", err);
      return res.status(500).json({ status: "error", message: "Erreur serveur." });
    }

    res.status(201).json({
      status: "success",
      message: "Température enregistrée.",
      insertedId: result.insertId, // 👍 si tu veux renvoyer l’ID
    });
  });
});

module.exports = router;
