import React, { useState, useRef, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../../assets/styles/sign-up.css";
import logo_euroelec from "../../assets/images/logo_euroelec.png";

const Signup = () => {
    // Vérifie que HOST et PORT sont définis
    const HOST = process.env.REACT_APP_SERVER_IP ;
    const PORT = process.env.REACT_APP_SERVER_PORT ;

    // États pour la visibilité des mots de passe
    const [passwordVisible, setPasswordVisible] = useState({
        password: false,
        confirmPassword: false,
    });

    // État pour le formulaire
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    // État pour les messages et le chargement
    const [message, setMessage] = useState({ type: "", text: "" });
    const [isLoading, setIsLoading] = useState(false);

    // Ref pour le canvas
    const canvasRef = useRef(null);

    // Animation particules (inchangé)
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let animationFrameId;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        resize();
        window.addEventListener("resize", resize);

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.radius = Math.random() * 2 + 1;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.3;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
                ctx.shadowBlur = 5;
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const particlesArray = [];
        const PARTICLE_COUNT = 80;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particlesArray.push(new Particle());
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesArray.forEach((particle) => {
                particle.update();
                particle.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Nettoyage des messages après 5 secondes
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: "", text: "" });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message.text]);

    // Fonction pour basculer la visibilité d'un mot de passe spécifique
    const togglePasswordVisibility = (field) => {
        setPasswordVisible((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    // Gestion des changements dans le formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Validation minimale du mot de passe
    const validatePassword = (password) => {
        return password.length >= 8;
    };

    // Soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Vérification des mots de passe
        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
            setIsLoading(false);
            return;
        }

        // Validation du mot de passe
        if (!validatePassword(formData.password)) {
            setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://${HOST}:${PORT}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();
            console.log("📥 Réponse du backend :", data);

            if (!response.ok) {
                throw new Error(data.message || "Une erreur est survenue lors de l'inscription.");
            }

            if (data.status === "success") {
                setMessage({ type: "success", text: data.message || "Inscription réussie ! Veuillez vous connecter." });
                setFormData({
                    fullName: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                });
            } else {
                throw new Error(data.message || "Une erreur est survenue.");
            }
        } catch (err) {
            console.error("❌ Erreur lors de l'inscription :", err.message);
            setMessage({ type: "error", text: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-page">
            <canvas ref={canvasRef} id="particles-canvas"></canvas>
            <div className="signup-wrapper">
                <div className="signup-left">
                    <img src={logo_euroelec} alt="Logo Euroelec" className="signup-logo" />
                    <h2 className="signup-motto">Rejoignez-nous et simplifiez votre supervision !</h2>
                </div>
                <div className="signup-right">
                    <div className="signup-container">
                        <h2 className="signup-title">Créer un compte !</h2>
                        {message.text && (
                            <p className={message.type === "error" ? "error-message" : "success-message"}>
                                {message.text}
                            </p>
                        )}
                        <form className="signup-form" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Nom complet"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="signup-input"
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Adresse mail"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="signup-input"
                                required
                            />
                            <div className="password-container">
                                <input
                                    type={passwordVisible.password ? "text" : "password"}
                                    name="password"
                                    placeholder="Mot de passe"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="signup-input"
                                    required
                                />
                                <span
                                    className="password-icon"
                                    onClick={() => togglePasswordVisibility("password")}
                                >
                                    {passwordVisible.password ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <div className="password-container">
                                <input
                                    type={passwordVisible.confirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Confirmer le mot de passe"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="signup-input"
                                    required
                                />
                                <span
                                    className="password-icon"
                                    onClick={() => togglePasswordVisibility("confirmPassword")}
                                >
                                    {passwordVisible.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <button
                                type="submit"
                                className="signup-button"
                                disabled={isLoading}
                            >
                                {isLoading ? "En cours..." : "S'inscrire"}
                            </button>
                        </form>
                        <p className="login-link">
                            Déjà inscrit ? <a href="/login">Connectez-vous ici</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
