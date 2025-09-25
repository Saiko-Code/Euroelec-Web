const express = require("express");
const router = express.Router();
const db = require("../configs/db");
const bcrypt = require("bcrypt");

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  console.log("📥 Données reçues pour inscription :", req.body);
  if (!fullName || !email || !password) {
    console.log("⚠️ Champs manquants :", { fullName, email, password });
    return res.status(400).json({ status: "error", message: "Champs manquants." });
  }
  try {
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        console.error("❌ Erreur SELECT :", err);
        return res.status(500).json({ status: "error", message: "Erreur serveur." });
      }
      if (results.length > 0) {
        console.log("⚠️ Email déjà utilisé :", email);
        return res.status(409).json({ status: "error", message: "Cet email est déjà utilisé." });
      }
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("🔑 Mot de passe hashé");
        db.query(
          "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
          [fullName, email, hashedPassword],
          (err, result) => {
            if (err) {
              console.error("❌ Erreur INSERT :", err.sqlMessage || err);
              return res.status(500).json({ status: "error", message: "Erreur serveur." });
            }
            console.log("✅ Utilisateur créé :", email);
            res.status(201).json({ status: "success", message: "Utilisateur créé." });
          }
        );
      } catch (err) {
        console.error("❌ Erreur bcrypt :", err);
        res.status(500).json({ status: "error", message: "Erreur de traitement du mot de passe." });
      }
    });
  } catch (err) {
    console.error("❌ Erreur inattendue :", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email et mot de passe requis." });
  }
  try {
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        console.error("❌ Erreur SELECT :", err);
        return res.status(500).json({ status: "error", message: "Erreur serveur." });
      }
      if (results.length === 0) {
        return res.status(404).json({ status: "error", message: "Utilisateur non trouvé." });
      }
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        res.status(200).json({
          status: "success",
          message: "Connexion réussie.",
          user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email
          },
        });
      } else {
        res.status(401).json({ status: "error", message: "Mot de passe incorrect." });
      }
    });
  } catch (err) {
    console.error("❌ Erreur inattendue :", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

module.exports = router;
