import React, { useEffect } from "react";
import { FaEye, FaEdit, FaTrash, FaPlay, FaPause } from "react-icons/fa";

// Helper pour afficher correctement les périodes ou jour
const displayPeriod = (program) => {
  if (program.isMultiDay) {
    const startDay = program.startDay ? program.startDay.charAt(0).toUpperCase() + program.startDay.slice(1) : "N/A";
    const endDay = program.endDay ? program.endDay.charAt(0).toUpperCase() + program.endDay.slice(1) : "N/A";
    return `${startDay} - ${endDay}`;
  }
  return program.day ? program.day.charAt(0).toUpperCase() + program.day.slice(1) : "N/A";
};

// Ligne de détail réutilisable
const ProgramDetailRow = ({ label, value }) => (
  <div className="program-detail-row">
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value}</span>
  </div>
);

const ProgramCard = ({
  schedule,
  setSchedule,
  setShowProgramModal,
  setEditingProgram,
  setShowAllProgramsModal,
  setNotification,
}) => {
  // Récupération des programmes depuis l'API
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch(
          `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/air-program`
        );
        if (!response.ok) throw new Error("Erreur lors de la récupération des programmes");
        const data = await response.json();

        const allPrograms = [
          ...(data.data.singleDay || []).map((p, index) => ({
            id: p.id || `single-${index}`,
            name: p.name || "N/A",
            day: p.day || "N/A",
            start: p.start_time || "00:00",
            end: p.end_time || "00:00",
            action: p.action || "N/A",
            is_active: p.is_active || 0,
            isMultiDay: false,
          })),
          ...(data.data.multiDay || []).map((p, index) => ({
            id: p.id ? `${p.id}-group` : `multi-${index}`,
            name: p.name || "N/A",
            startDay: p.startDay || "N/A",
            endDay: p.endDay || "N/A",
            start: p.startTime || "00:00",
            end: p.endTime || "00:00",
            action: p.action || "N/A",
            is_active: p.is_active || 0,
            isMultiDay: true,
          })),
        ];

        setSchedule(allPrograms);
      } catch (err) {
        console.error(err);
        setNotification({ type: "error", message: "Impossible de charger les programmes" });
      }
    };
    fetchPrograms();
  }, [setSchedule, setNotification]);

  // Supprimer un programme
  const deleteProgram = async (programId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette programmation ?")) return;
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/air-program/${programId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Erreur lors de la suppression de la programmation");

      const ids = String(programId).split("-");
      setSchedule((prev) => prev.filter((p) => !ids.includes(String(p.id))));
      setNotification({ type: "success", message: "Programmation supprimée avec succès." });
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: err.message || "Erreur lors de la suppression." });
    }
  };

  // Activer / désactiver un programme
  const toggleProgram = async (program) => {
    const newStatus = program.is_active ? 0 : 1;
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/air-program/activate/${program.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: newStatus }),
        }
      );
      if (!response.ok) throw new Error("Erreur lors de la modification du statut");

      setSchedule((prev) =>
        prev.map((p) => (p.id === program.id ? { ...p, is_active: newStatus } : p))
      );
      setNotification({ type: "success", message: `Programme ${newStatus ? "activé" : "désactivé"}.` });
    } catch (err) {
      console.error(err);
      setNotification({ type: "error", message: err.message || "Erreur lors de la modification du programme." });
    }
  };

  // Calcul dynamique de la progression
  const computeProgress = (program) => {
    if (!program.is_active) return 0;
    const now = new Date();
    const [startH, startM] = (program.start || "00:00").split(":").map(Number);
    const [endH, endM] = (program.end || "00:00").split(":").map(Number);
    const start = new Date(); start.setHours(startH, startM, 0, 0);
    const end = new Date(); end.setHours(endH, endM, 0, 0);
    if (now <= start) return 0;
    if (now >= end) return 100;
    return ((now - start) / (end - start)) * 100;
  };

  const activeProgram = schedule.find((p) => p.is_active);
  const otherPrograms = schedule.filter((p) => !p.is_active);

  return (
    <div className="programm-card">
      <div className="card-schedule custom-card">
        <div className="custom-card-header green">Programmation ventilation</div>
        <div className="custom-card-body">

          {/* Programme en cours */}
          <div className="current-program-container">
            <h3 className="program-section-title">Programme en cours</h3>
            {activeProgram ? (
              <div className="program-active">
                <div className="program-header">
                  <h4>{activeProgram.name} - {activeProgram.action}</h4>
                  <span className="program-status active">ACTIF</span>
                </div>
                <div className="program-details">
                  <ProgramDetailRow label="Jour:" value={displayPeriod(activeProgram)} />
                  <ProgramDetailRow label="Heure:" value={`${activeProgram.start} - ${activeProgram.end}`} />
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${computeProgress(activeProgram)}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="no-programs">Aucun programme en cours.</p>
            )}
          </div>

          {/* Programmes créés */}
          <div className="recent-programs-container">
            <div className="recent-programs-title">Programmes créés ({otherPrograms.length})</div>
            {otherPrograms.length > 0 ? (
              <div className="recent-programs-list">
                {otherPrograms.map((program, index) => (
                  <div key={program.id || `program-${index}`} className="recent-program-item">
                    <div className="program-item-header">
                      <h4>{displayPeriod(program)}</h4>
                      <div className="program-item-actions">
                        <button onClick={() => { setEditingProgram(program); setShowProgramModal(true); }}><FaEdit /></button>
                        <button onClick={() => deleteProgram(program.id)}><FaTrash /></button>
                        <button onClick={() => toggleProgram(program)}>{program.is_active ? <FaPause /> : <FaPlay />}</button>
                      </div>
                    </div>
                    <div className="program-item-details">
                      <ProgramDetailRow label="Nom:" value={program.name || "N/A"} />
                      <ProgramDetailRow label="Jour:" value={displayPeriod(program)} />
                      <ProgramDetailRow label="Heure:" value={`${program.start || "00:00"} - ${program.end || "00:00"}`} />
                      <ProgramDetailRow label="Action:" value={program.action || "N/A"} />
                      <ProgramDetailRow label="État:" value={program.is_active ? "ACTIF" : "INACTIF"} />
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
              <button className="custom-btn green view-all-btn" onClick={() => setShowAllProgramsModal(true)}>
                <FaEye /> Voir tous les programmes ({schedule.length})
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProgramCard;
