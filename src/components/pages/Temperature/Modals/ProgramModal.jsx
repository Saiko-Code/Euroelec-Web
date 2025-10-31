import React, { useState, useEffect } from "react";
import CustomTimePicker from "../CustomTimePicker";

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

const DaySelector = ({ days, activeDays, toggleDay }) => (
  <div className="day-selector">
    {days.map((day) => (
      <button
        type="button"
        key={day}
        className={`day-btn ${activeDays.includes(day) ? "active" : ""}`}
        onClick={() => toggleDay(day)}
      >
        {day ? day.slice(0, 3).toUpperCase() : "N/A"}
      </button>
    ))}
  </div>
);

const ProgramModal = ({
  editingProgram,
  setEditingProgram,
  setShowProgramModal,
  setNotification,
  refreshPrograms,
}) => {
  const [selectedDays, setSelectedDays] = useState([]);
  const [dayTimes, setDayTimes] = useState({});
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]);
  const [programName, setProgramName] = useState("");

  // Préremplissage en mode édition
  useEffect(() => {
    if (editingProgram) {
      const daysList = (editingProgram.days || (editingProgram.day ? [editingProgram.day] : []))
        .filter(Boolean)
        .map((d) => d.toLowerCase());

      setSelectedDays(daysList);

      const tempTimes = {};
      if (daysList.length > 0) {
        tempTimes[daysList[0]] = { start: editingProgram.start || "00:00:00" };
        tempTimes[daysList[daysList.length - 1]] = { end: editingProgram.end || "23:59:59" };
      }
      setDayTimes(tempTimes);
      setProgramName(editingProgram.name || "");
    }
  }, [editingProgram]);

  const closeModal = () => {
    setEditingProgram(null);
    setShowProgramModal(false);
  };

  const resetForm = () => {
    setSelectedDays([]);
    setRepeatDays([]);
    setDayTimes({});
    setProgramName("");
    setRepeatEnabled(false);
    closeModal();
  };

  const toggleDay = (day, type = "selected") => {
    if (!day) return;
    if (type === "selected") {
      setSelectedDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    } else {
      setRepeatDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    }
    if (!dayTimes[day]) {
      setDayTimes((prev) => ({ ...prev, [day]: { start: "", end: "" } }));
    }
  };

  const handleTimeChange = (day, type, value) => {
    if (!day) return;
    setDayTimes((prev) => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = e.target.action.value;

    const activeDays = repeatEnabled ? repeatDays : selectedDays;
    const isRepeated = repeatEnabled && repeatDays.length === DAYS.length;
    const isMultiDay = !isRepeated && activeDays.length > 1;

    if (!programName.trim()) {
      return setNotification({ type: "error", message: "Veuillez saisir un nom pour le programme." });
    }

    if (activeDays.length === 0) {
      return setNotification({ type: "error", message: "Veuillez sélectionner au moins un jour." });
    }

    // Correction : toujours définir start et end
    const firstDay = activeDays[0];
    const lastDay = activeDays[activeDays.length - 1];
    const startTime = dayTimes[firstDay]?.start || "00:00:00";
    const endTime = dayTimes[lastDay]?.end || "23:59:59";

    const payload = {
      name: programName.trim(),
      action,
      isMultiDay,
      isRepeated,
      days: activeDays,
      day: firstDay,
      start: startTime,
      end: endTime,
    };

    console.log("Payload envoyé :", payload);

    try {
      const url = editingProgram
        ? `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/air-program/${editingProgram.id}`
        : `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/air-program`;

      const method = editingProgram ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error("Réponse serveur:", result);
        throw new Error(result.message || "Erreur lors de l'enregistrement");
      }

      setNotification({
        type: "success",
        message: editingProgram ? "Programme modifié !" : "Programme ajouté !",
      });

      resetForm();
      if (refreshPrograms) refreshPrograms();
    } catch (err) {
      console.error("❌ Erreur handleSubmit:", err);
      setNotification({ type: "error", message: err.message || "Erreur serveur." });
    }
  };

  const activeDays = repeatEnabled ? repeatDays : selectedDays;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{editingProgram ? "Modifier la programmation" : "Ajouter une programmation"}</h3>
          <button className="close-modal" onClick={closeModal}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="schedule-form">
          {/* Nom */}
          <div className="form-section">
            <label>Nom du programme :</label>
            <input
              type="text"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="Ex: Ventilation Matinale"
              required
            />
          </div>

          {/* Jours */}
          <div className="form-section">
            <label>Sélectionnez les jours :</label>
            <DaySelector
              days={DAYS}
              activeDays={selectedDays}
              toggleDay={(day) => toggleDay(day, "selected")}
            />
          </div>

          {/* Heures */}
          {activeDays.length > 0 && (
            <div className="form-section">
              <label>Heures :</label>
              <div className="time-inputs">
                <div className="time-input-group">
                  <label>Début :</label>
                  <CustomTimePicker
                    onChange={(value) => handleTimeChange(activeDays[0], "start", value)}
                    value={dayTimes[activeDays[0]]?.start || ""}
                  />
                </div>
                <div className="time-input-group">
                  <label>Fin :</label>
                  <CustomTimePicker
                    onChange={(value) => handleTimeChange(activeDays[activeDays.length - 1], "end", value)}
                    value={dayTimes[activeDays[activeDays.length - 1]]?.end || ""}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action */}
          <div className="form-section">
            <label>Action :</label>
            <select name="action" className="select-action" required>
              <option value="ventilation">Ventilation</option>
            </select>
          </div>

          {/* Répétition */}
          <div className="form-section repeat-section">
            <label>Répétition :</label>
            <div className="modal-actions">
              <button
                type="button"
                className="custom-btn cancel-btn"
                onClick={() => setRepeatEnabled(!repeatEnabled)}
              >
                {repeatEnabled ? "Désactiver la répétition" : "Répéter sur certains jours"}
              </button>
              <button
                type="button"
                className="custom-btn submit-btn"
                onClick={() => {
                  setRepeatEnabled(true);
                  setRepeatDays([...DAYS]);
                }}
              >
                Répéter toute la semaine
              </button>
            </div>
            {repeatEnabled && (
              <DaySelector
                days={DAYS}
                activeDays={repeatDays}
                toggleDay={(day) => toggleDay(day, "repeat")}
              />
            )}
          </div>

          {/* Boutons */}
          <div className="modal-actions">
            <button type="submit" className="custom-btn submit-btn">
              {editingProgram
                ? "Enregistrer les modifications"
                : activeDays.length > 1
                ? `Programmer ${repeatEnabled ? "en répétition" : `pour ${activeDays.length} jours`}`
                : "Ajouter la programmation"}
            </button>
            {editingProgram && (
              <button type="button" className="custom-btn cancel-btn" onClick={resetForm}>
                Annuler la modification
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramModal;
