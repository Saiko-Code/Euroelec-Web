import React from "react";
import { FaSearch, FaTimes, FaEdit, FaTrash } from "react-icons/fa";

// Helper pour afficher correctement les périodes de programme
const displayPeriod = (program) => {
  if (program.isMultiDay) {
    const startDay = program.startDay
      ? program.startDay.charAt(0).toUpperCase() + program.startDay.slice(1)
      : "";
    const endDay = program.endDay
      ? program.endDay.charAt(0).toUpperCase() + program.endDay.slice(1)
      : "";
    return `${startDay} - ${endDay}`;
  }
  return program.day ? program.day.charAt(0).toUpperCase() + program.day.slice(1) : "N/A";
};

const AllProgramsModal = ({
  filteredSchedule,
  setShowAllProgramsModal,
  setEditingProgram,
  setShowProgramModal,
  searchTerm,
  setSearchTerm,
  setNotification,
  setSchedule,
  setFilteredSchedule,
}) => {
  const deleteProgram = async (programId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce programme ?")) return;
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/air-program/${programId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Erreur lors de la suppression de la programmation.");

      const programIdStr = String(programId);
      setSchedule(prev =>
        prev.filter(p => !programIdStr.split("-").includes(String(p.id)))
      );
      setFilteredSchedule(prev =>
        prev.filter(p => !programIdStr.split("-").includes(String(p.id)))
      );

      setNotification({ type: "success", message: "Programmation supprimée avec succès." });
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      setNotification({ type: "error", message: err.message || "Erreur lors de la suppression." });
    }
  };

  return (
    <div className="modal-overlay all-programs-modal">
      <div className="modal-content all-programs-content">
        <div className="modal-header">
          <h3>Tous les programmes ({filteredSchedule.length})</h3>
          <button
            className="close-modal"
            onClick={() => {
              setShowAllProgramsModal(false);
              setSearchTerm("");
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Recherche */}
        <div className="all-programs-search">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un programme..."
              className="program-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Liste de tous les programmes */}
        <div className="all-programs-list-container">
          {filteredSchedule.length > 0 ? (
            <div className="all-programs-list">
              {filteredSchedule.map((program) => (
                <div key={program.id} className="all-program-item">
                  <div className="program-item-main">
                    <div className="program-item-header">
                      <h4>{displayPeriod(program)}</h4>
                      <div className="program-item-actions">
                        <button
                          className="edit-program-btn"
                          onClick={() => {
                            setEditingProgram(program);
                            setShowProgramModal(true);
                            setShowAllProgramsModal(false);
                            setSearchTerm("");
                          }}
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="delete-program-btn"
                          onClick={() => deleteProgram(program.id)}
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="program-item-details">
                      <div className="program-detail-row">
                        <span className="detail-label">Nom:</span>
                        <span className="detail-value">{program.name}</span>
                      </div>
                      <div className="program-detail-row">
                        <span className="detail-label">Heure:</span>
                        <span className="detail-value">{program.start} - {program.end}</span>
                      </div>
                      <div className="program-detail-row">
                        <span className="detail-label">Action:</span>
                        <span className="detail-value">{program.action}</span>
                      </div>
                      {program.isMultiDay && (
                        <div className="program-detail-row">
                          <span className="detail-label">Période:</span>
                          <span className="detail-value">{displayPeriod(program)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-programs-modal">
              <p>Aucun programme trouvé{searchTerm ? ` pour "${searchTerm}"` : ""}.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="custom-btn cancel-btn"
            onClick={() => {
              setShowAllProgramsModal(false);
              setSearchTerm("");
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllProgramsModal;
