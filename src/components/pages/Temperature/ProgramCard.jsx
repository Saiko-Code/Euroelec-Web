import React, { useEffect, useCallback, useState } from "react";
import { FaTrash, FaPlay, FaPause } from "react-icons/fa";

// 📅 Affichage de la période
const displayPeriod = (program) => {
  if (program.isRepeated) return "Chaque semaine";
  if (program.isMultiDay) {
    const start = program.startDay ? capitalize(program.startDay) : "N/A";
    const end = program.endDay ? capitalize(program.endDay) : "N/A";
    return `${start} - ${end}`;
  }
  return program.day ? capitalize(program.day) : "N/A";
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Ligne d'information simple
const ProgramDetailRow = ({ label, value }) => (
  <div className="program-detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value}</span>
  </div>
);

// 🔍 Trouve le programme actif selon jour et heure
const getCurrentProgram = (programs) => {
  const now = new Date();
  const currentDay = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ][now.getDay()];

  const parseTime = (t) => {
    const [h, m] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  return (
    programs
      .filter((p) => p.is_active)
      .find((p) => {
        const start = parseTime(p.start);
        const end = parseTime(p.end);
        if (p.isRepeated) return now >= start && now <= end;
        if (p.day && p.day.toLowerCase() === currentDay)
          return now >= start && now <= end;
        return false;
      }) || null
  );
};

const ProgramCard = ({
  schedule,
  setSchedule,
  setShowProgramModal,
  setEditingProgram,
  setShowAllProgramsModal,
  setNotification,
}) => {
  const [activeProgram, setActiveProgram] = useState(null);

  // ⚡ Récupération API
  const refreshPrograms = useCallback(async () => {
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/air-program`
      );
      if (!response.ok) throw new Error("Erreur API");

      const data = await response.json();
      const { singleDay = [], multiDay = [] } = data.data || {};

      const formatted = [
        ...singleDay.map((p) => ({
          id: p.id,
          name: p.name,
          day: p.day,
          start: p.start_time,
          end: p.end_time,
          action: p.action,
          is_active: p.is_active,
          isMultiDay: false,
          isRepeated: p.isRepeated || false,
        })),
        ...multiDay.map((p) => ({
          id: p.id,
          name: p.name,
          startDay: p.startDay,
          endDay: p.endDay,
          start: p.startTime,
          end: p.endTime,
          action: p.action,
          is_active: p.is_active,
          isMultiDay: true,
          isRepeated: p.isRepeated || false,
        })),
      ];

      setSchedule(formatted);
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: "Impossible de charger les programmes." });
    }
  }, [setSchedule, setNotification]);

  // Initialisation
  useEffect(() => {
    refreshPrograms();
  }, [refreshPrograms]);

  // Programme actif dynamique
  useEffect(() => {
    const updateActive = () => setActiveProgram(getCurrentProgram(schedule));
    updateActive();
    const interval = setInterval(updateActive, 60 * 1000);
    return () => clearInterval(interval);
  }, [schedule]);

  // Supprimer un programme
  const deleteProgram = async (id) => {
    if (!window.confirm("Supprimer cette programmation ?")) return;
    try {
      const res = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/air-program/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setNotification({ type: "success", message: "Programme supprimé." });
      refreshPrograms();
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    }
  };

  // Activation / désactivation
  const toggleProgram = async (program) => {
    const newStatus = program.is_active ? 0 : 1;
    try {
      const res = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/air-program/activate/${program.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Erreur mise à jour");
      setNotification({
        type: "success",
        message: `Programme ${newStatus ? "activé" : "désactivé"}.`,
      });
      refreshPrograms();
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    }
  };

  // Progression
  const computeProgress = (p) => {
    if (!p.is_active) return 0;
    const now = new Date();
    const [sh, sm] = p.start.split(":").map(Number);
    const [eh, em] = p.end.split(":").map(Number);
    const start = new Date();
    start.setHours(sh, sm, 0, 0);
    const end = new Date();
    end.setHours(eh, em, 0, 0);
    if (now <= start) return 0;
    if (now >= end) return 100;
    return ((now - start) / (end - start)) * 100;
  };

  const otherPrograms = schedule.filter((p) => p.id !== activeProgram?.id);

  return (
    <div className="programm-card">
      <div className="card-schedule custom-card">
        <div className="custom-card-header green">Programmation ventilation</div>

        <div className="custom-card-body">
          {/* Programme actif */}
          <div className="current-program-container">
            <h3 className="program-section-title">Programme en cours</h3>
            {activeProgram ? (
              <div className="program-active">
                <div className="program-header">
                  <div className="program-header-left">
                    <h4>{activeProgram.name} - {activeProgram.action}</h4>
                    <span className="program-status active">ACTIF</span>
                  </div>
                  <div className="program-item-actions">
                    <button onClick={() => toggleProgram(activeProgram)}>
                      {activeProgram.is_active ? <FaPause /> : <FaPlay />}
                    </button>
                    <button onClick={() => deleteProgram(activeProgram.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="program-details">
                  <ProgramDetailRow label="Période:" value={displayPeriod(activeProgram)} />
                  <ProgramDetailRow label="Heure:" value={`${activeProgram.start} - ${activeProgram.end}`} />
                  <div className="progress-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${computeProgress(activeProgram)}%` }}
                    >
                      <span className="progress-percentage">
                        {Math.round(computeProgress(activeProgram))}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="no-programs">Aucun programme actif.</p>
            )}
          </div>

          {/* Liste des autres programmes */}
          <div className="recent-programs-container">
            <div className="recent-programs-title">
              Programmes créés ({otherPrograms.length})
            </div>
            {otherPrograms.length > 0 ? (
              <div className="recent-programs-list">
                {otherPrograms.map((p, i) => (
                  <div key={p.id || i} className="recent-program-item">
                    <div className="program-item-header">
                      <h4>{displayPeriod(p)}</h4>
                      <div className="program-item-actions">
                        <button onClick={() => { setEditingProgram(p); setShowProgramModal(true); }}>✏️</button>
                        <button onClick={() => deleteProgram(p.id)}>🗑️</button>
                        <button onClick={() => toggleProgram(p)}>
                          {p.is_active ? "⏸️" : "▶️"}
                        </button>
                      </div>
                    </div>
                    <div className="program-item-details">
                      <ProgramDetailRow label="Nom:" value={p.name} />
                      <ProgramDetailRow label="Période:" value={displayPeriod(p)} />
                      <ProgramDetailRow label="Heure:" value={`${p.start} - ${p.end}`} />
                      <ProgramDetailRow label="Action:" value={p.action} />
                      <ProgramDetailRow label="État:" value={p.is_active ? "ACTIF" : "INACTIF"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-programs">Aucun programme créé.</p>
            )}
          </div>

          {/* Actions */}
          <div className="program-actions-container">
            <button
              className="custom-btn blue add-program-btn"
              onClick={() => { setShowProgramModal(true); setEditingProgram(null); }}
            >
              Ajouter un programme
            </button>
            {schedule.length > 2 && (
              <button
                className="custom-btn blue view-all-btn"
                onClick={() => setShowAllProgramsModal(true)}
              >
                👀 Voir tous ({schedule.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramCard;
