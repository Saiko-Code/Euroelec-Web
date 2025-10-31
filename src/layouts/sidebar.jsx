import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiHome,
  FiThermometer,
  FiSettings,
  FiMail,
  FiLogOut,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import "../assets/styles/sidebar.css";
import logoImg from "../assets/images/logo_euroelec.png";

const Sidebar = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Détection du viewport
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    if (!mobile) setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Empêche le scroll quand le menu mobile est ouvert
  useEffect(() => {
    document.body.style.overflow = isMobile && isOpen ? "hidden" : "";
  }, [isMobile, isOpen]);

  // Fermeture avec Échap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isMobile && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobile, isOpen]);

  const toggleSidebar = () => {
    if (isMobile) setIsOpen((prev) => !prev);
    else setIsCollapsed((prev) => !prev);
  };

  const handleLogout = () => navigate("/login");

  const menuItems = [
    { name: "Accueil", path: "/dashboard", icon: <FiHome /> },
    { name: "Température", path: "/temperature", icon: <FiThermometer /> },
    { name: "Contact", path: "/contact", icon: <FiMail /> },
    { name: "Services", path: "/services", icon: <FiSettings /> },
  ];

  const sidebarVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 18 },
    },
    exit: { x: "-100%", opacity: 0, transition: { duration: 0.25 } },
  };

  return (
    <>
      {/* ===== HAMBURGER FLOATING (fermé) ===== */}
      {isMobile && !isOpen && (
        <button
          className="hamburger-menu-btn floating"
          onClick={toggleSidebar}
          aria-label="Ouvrir le menu"
        >
          <div className="hamburger-icon">
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </div>
        </button>
      )}

      {/* ===== SIDEBAR ===== */}
      <AnimatePresence>
        {(isMobile && isOpen) || !isMobile ? (
          <motion.aside
            className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
              isMobile && isOpen ? "open" : ""
            }`}
            variants={isMobile ? sidebarVariants : {}}
            initial={isMobile ? "hidden" : false}
            animate={isMobile ? "visible" : false}
            exit="exit"
          >
            <div className="sidebar-header">
              <div className="sidebar-logo">
                <img src={logoImg} alt="EuroElec" />
              </div>

              {/* ===== HAMBURGER INTÉGRÉ (mobile ouvert) ===== */}
              {isMobile && (
                <button
                  className="hamburger-menu-btn inside"
                  onClick={toggleSidebar}
                  aria-label="Fermer le menu"
                >
                  <div className="hamburger-icon open">
                    <span className="hamburger-bar"></span>
                    <span className="hamburger-bar"></span>
                    <span className="hamburger-bar"></span>
                  </div>
                </button>
              )}

              {/* ===== TOGGLE (desktop) ===== */}
              {!isMobile && (
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                  {isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
                </button>
              )}
            </div>

            {/* ===== NAVIGATION ===== */}
            <nav className="sidebar-nav">
              <ul>
                {menuItems.map(({ name, path, icon }) => (
                  <li key={path}>
                    <button
                      className={`sidebar-link ${
                        location.pathname === path ? "active" : ""
                      }`}
                      onClick={() => {
                        navigate(path);
                        if (isMobile) setIsOpen(false);
                      }}
                    >
                      {icon}
                      <span>{name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ===== LOGOUT ===== */}
            <div className="sidebar-logout">
              <button className="logout-button" onClick={handleLogout}>
                <FiLogOut /> <span>Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {/* ===== OVERLAY MOBILE ===== */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            className="overlay"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* ===== MAIN CONTENT ===== */}
      <main
        className={`main-content ${isCollapsed && !isMobile ? "collapsed" : ""}`}
      >
        {children}
      </main>
    </>
  );
};

export default Sidebar;
