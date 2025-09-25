import React, { useState, useCallback } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

const GroupCard = React.memo(({
  groups,
  setGroups,
  sensorsList,
  setNotification,
}) => {
  const [groupName, setGroupName] = useState("");
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null);

  const togglePointInGroup = useCallback((point) => {
    setSelectedPoints(prev => prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point]);
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/sensor-groups`
      );
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const data = await response.json();
      if (data.status === "success") setGroups(data.data);
    } catch (err) {
      console.error("Erreur lors du chargement des groupes :", err);
    }
  }, [setGroups]);

  const handleAddGroup = useCallback(async () => {
    if (!groupName.trim()) {
      setNotification("error", "Veuillez entrer un nom pour le groupe.");
      return;
    }
    if (selectedPoints.length === 0) {
      setNotification("error", "Veuillez sélectionner au moins un capteur.");
      return;
    }
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/sensor-groups`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: groupName, sensors: selectedPoints }),
        }
      );
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const data = await response.json();
      if (data.status === "success") {
        setNotification("success", "Groupe ajouté avec succès!");
        setGroupName("");
        setSelectedPoints([]);
        fetchGroups();
      } else {
        setNotification("error", "Erreur lors de l'ajout du groupe.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setNotification("error", "Erreur lors de la communication avec le serveur.");
    }
  }, [groupName, selectedPoints, setNotification, fetchGroups]);

  const handleUpdateGroup = useCallback(async () => {
    if (!groupName.trim()) {
      setNotification("error", "Veuillez entrer un nom pour le groupe.");
      return;
    }
    if (selectedPoints.length === 0) {
      setNotification("error", "Veuillez sélectionner au moins un capteur.");
      return;
    }
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/sensor-groups/${editingGroupId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: groupName, sensors: selectedPoints }),
        }
      );
      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const data = await response.json();
      if (data.status === "success") {
        setNotification("success", "Groupe mis à jour avec succès!");
        setGroupName("");
        setSelectedPoints([]);
        setEditingGroupId(null);
        fetchGroups();
      } else {
        setNotification("error", "Erreur lors de la mise à jour du groupe.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setNotification("error", "Erreur lors de la communication avec le serveur.");
    }
  }, [groupName, selectedPoints, editingGroupId, setNotification, fetchGroups]);

  const handleDeleteGroup = useCallback(async (groupId) => {
    const isConfirmed = window.confirm("Êtes-vous sûr de vouloir supprimer ce groupe de sondes ?");
    if (!isConfirmed) return;
    try {
      const response = await fetch(
        `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}/sensor-groups/${groupId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Erreur lors de la suppression du groupe.");
      setNotification("success", "Groupe supprimé avec succès.");
      fetchGroups();
    } catch (err) {
      console.error("Erreur lors de la suppression du groupe :", err);
      setNotification("error", err.message || "Erreur lors de la suppression du groupe.");
    }
  }, [setNotification, fetchGroups]);

  const handleEditGroup = useCallback((group) => {
    setGroupName(group.name);
    setSelectedPoints(group.sensors);
    setEditingGroupId(group.id);
  }, []);

  return (
    <div className="group-card">
      <div className="card-list custom-card">
        <div className="custom-card-header blue">Groupes de sondes existants</div>
        <div className="custom-card-body">
          <div className="form-section-list">
            <h3 className="form-title">Créer un groupe</h3>
            <div className="form-group">
              <input
                type="text"
                placeholder="Nom du groupe"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="sensor-selector">
              <h6 className="form-subtitle">Sélectionnez les points :</h6>
              <div className="sensor-buttons-container">
                {sensorsList.map((point) => (
                  <button
                    key={point}
                    className={`sensor-toggle-btn ${selectedPoints.includes(point) ? "active" : ""}`}
                    onClick={() => togglePointInGroup(point)}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>
            {!editingGroupId ? (
              <button onClick={handleAddGroup} className="from-section-list submit-btn">
                Ajouter le groupe
              </button>
            ) : (
              <div className="edit-btn-list">
                <button className="custom-btn green" onClick={handleUpdateGroup}>
                  Mettre à jour
                </button>
                <button
                  className="custom-btn red"
                  onClick={() => {
                    setEditingGroupId(null);
                    setGroupName("");
                    setSelectedPoints([]);
                  }}
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">Liste des sondes</h3>
          {groups.length > 0 ? (
            <ul className="group-list">
              {groups.map((group) => (
                <li key={group.id} className="group-item">
                  <div className="group-info">
                    <strong>{group.name}</strong>
                    <div className="group-sensors">
                      {group.sensors.sort((a, b) => a.localeCompare(b)).map((sensor) => (
                        <span key={sensor} className="sensor-tag">
                          {sensor}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="group-actions">
                    <button className="edit-btn custom-btn" onClick={() => handleEditGroup(group)} title="Modifier ce groupe">
                      <FaEdit />
                    </button>
                    <button
                      className="delete-btn custom-btn"
                      onClick={() => handleDeleteGroup(group.id)}
                      title="Supprimer ce groupe"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data-msg">Aucun groupe de sondes existant.</p>
          )}
        </div>
      </div>
    </div>
  );
});

export default GroupCard;
