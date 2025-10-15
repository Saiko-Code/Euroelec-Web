import React, { useState, useEffect } from "react";
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
import { useNavigate } from "react-router-dom"; // ✅ Import navigation
import "../assets/styles/sidebar.css";
import logoImg from "../assets/images/logo_euroelec.png";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); // ✅ Hook navigation

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) setIsOpen(!isOpen);
    else setIsCollapsed(!isCollapsed);
  };

  const closeSidebar = () => setIsOpen(false);

  const handleLogout = () => {
    // ✅ Suppression des tokens/session
    localStorage.removeItem("token");
    sessionStorage.clear();

    // ✅ Redirection vers la page de login
    navigate("/login");
  };

  const menuItems = [
    { name: "Accueil", path: "/dashboard", icon: <FiHome /> },
    { name: "Température", path: "/temperature", icon: <FiThermometer /> },
    { name: "Contact", path: "/contact", icon: <FiMail /> },
    { name: "Services", path: "/services", icon: <FiSettings /> },
  ];

  const sidebarVariants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
    exit: { x: "-100%", opacity: 0 },
  };

  return (
    <>
      {/* ===== SIDEBAR ===== */}
      <motion.aside
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile && isOpen ? "open" : ""}`}
        variants={sidebarVariants}
        initial={isMobile ? "hidden" : false}
        animate={isMobile && isOpen ? "visible" : false}
        exit="exit"
      >
        {/* ===== HEADER LOGO + TOGGLE ===== */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logoImg} alt="EuroElec logo" />
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isCollapsed ? <FiMenu size={22} /> : <FiX size={22} />}
          </button>
        </div>

        {/* ===== NAVIGATION ===== */}
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item, index) => (
              <li key={index}>
                <a href={item.path} className="sidebar-link" onClick={closeSidebar}>
                  <i>{item.icon}</i>
                  <span>{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ===== LOGOUT BUTTON ===== */}
        <div className="sidebar-logout">
          <button className="logout-button" onClick={handleLogout}>
            <FiLogOut /> <span>Déconnexion</span>
          </button>
        </div>
      </motion.aside>

      {/* ===== MOBILE OVERLAY ===== */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            className="overlay"
            onClick={closeSidebar}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* ===== MAIN CONTENT ===== */}
      <main className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        {/* Contenu principal des pages */}
      </main>
    </>
  );
};

export default Sidebar;
