import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message)
    return res.status(400).json({ error: "Champs manquants" });

  try {
    // Transport configuré selon ton service mail
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,       // ex: "smtp.gmail.com"
      port: process.env.MAIL_PORT || 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.MAIL_TO,           // ton adresse de réception
      subject: "Nouveau message depuis le formulaire de contact",
      text: `Nom : ${name}\nEmail : ${email}\n\nMessage :\n${message}`,
    });

    res.status(200).json({ message: "Email envoyé avec succès" });
  } catch (err) {
    console.error("Erreur d'envoi d'email :", err);
    res.status(500).json({ error: "Erreur d'envoi de mail" });
  }
});

export default router;
