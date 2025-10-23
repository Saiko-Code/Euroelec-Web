import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import "../../assets/styles/contact.css";
import Sidebar from "../../layouts/sidebar";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();
      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
      
      // Réinitialiser le statut après 5 secondes
      setTimeout(() => setStatus(null), 5000);
    } catch {
      setStatus("error");
      
      // Réinitialiser le statut après 5 secondes
      setTimeout(() => setStatus(null), 5000);
    }
  };

  return (
    <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
      <div className="contact-container">
        <button
          className="hamburger-menu-btn"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Menu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Particules flottantes */}
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>

        {/* Étoiles scintillantes */}
        <div className="star star-1"></div>
        <div className="star star-2"></div>
        <div className="star star-3"></div>
        <div className="star star-4"></div>
        <div className="star star-5"></div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Contactez-nous</h2>

          <div className="form-group">
            <label htmlFor="name">Nom</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Votre nom complet"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="votre.email@exemple.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              placeholder="Écrivez votre message ici..."
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className={status === "loading" ? "loading" : ""}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Envoi en cours..." : "Envoyer"}
          </button>

          <div className={`contact-status ${status === "success" ? "success" : ""} ${status === "error" ? "error" : ""}`}>
            {status === "success" && "Message envoyé avec succès !"}
            {status === "error" && "Une erreur est survenue. Réessayez."}
          </div>
        </form>
      </div>
    </Sidebar>
  );
}