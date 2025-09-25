import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../../assets/styles/login.css';
import logo_euroelec from '../../assets/images/logo_euroelec.png';

const PORT = process.env.REACT_APP_SERVER_PORT;
const HOST = process.env.REACT_APP_SERVER_IP;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);    
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (email === '' || password === '') {
            setError('Veuillez remplir tous les champs.');
            return;
        }

        try {
            const response = await fetch(`http://${HOST}:${PORT}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Supposons que ton serveur renvoie user et un message de succès
                setError('');
                localStorage.setItem('auth', 'true');
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard'); // redirection vers /home
            } else {
                // Affiche message d'erreur venant du serveur ou message générique
                setError(data.error || 'Email ou mot de passe incorrect.');
            }
        } catch (err) {
            setError('Erreur réseau. Veuillez réessayer plus tard.');
            console.error('Erreur fetch login:', err);
        }
    };

    return (
        <div className="login-page">
            <div className="background-shapes">
                <div className="shape"></div>
                <div className="shape"></div>
                <div className="shape"></div>
                <div className="shape"></div>
                <div className="shape"></div>
            </div>
            <div className="login-container">
                <img src={logo_euroelec} alt="Logo Euroelec" className="login-logo" />
                <h2 className="login-title">Connexion</h2>
                {error && <p className="login-error">{error}</p>}
                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="email"
                        placeholder="Adresse mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="login-input"
                        required
                    />
                    <div className="password-container">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input password-input"
                            required
                        />
                        <span className="password-icon" onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    <div className="login-links">
                        <Link to="/forgot-password" className="forgot-password">
                            Mot de passe oublié ?
                        </Link>
                    </div>
                    <button type="submit" className="login-button">Se connecter</button>
                </form>
                <p className="register-link">
                    Pas encore de compte ? <Link to="/sign-up">Inscrivez-vous gratuitement</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
