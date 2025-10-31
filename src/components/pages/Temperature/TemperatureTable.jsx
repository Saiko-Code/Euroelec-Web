import React, { useMemo } from "react";
import "../../../assets/styles/dashboard.css";

const TemperatureTable = ({
  tempsToDisplay = [],
  groups = [],
  selectedFilterGroupId,
  setSelectedFilterGroupId,
}) => {
  // Filtre par groupe si sélectionné (optimisé avec useMemo)
  const filteredTemps = useMemo(() => {
    if (!selectedFilterGroupId) return tempsToDisplay;
    
    const groupId = parseInt(selectedFilterGroupId, 10);
    const group = groups.find((g) => g.id === groupId);
    
    if (!group?.sensors) return [];
    
    return tempsToDisplay.filter((t) => 
      group.sensors.includes(t.sensor_name)
    );
  }, [selectedFilterGroupId, tempsToDisplay, groups]);

  // Formatage de la date et heure (fonction réutilisable)
  const formatDateTime = (timestamp) => {
    const dateObj = new Date(timestamp);
    const localDate = dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const localTime = dateObj.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { localDate, localTime };
  };

  return (
    <div className="temp-card custom-card">
      <div className="filter-by-group custom-card-header">
        <label htmlFor="filter-group-select">Filtrer par groupe :</label>
        <select
          id="filter-group-select"
          className="select-group"
          value={selectedFilterGroupId || ""}
          onChange={(e) => setSelectedFilterGroupId(e.target.value)}
          aria-label="Sélectionner un groupe de capteurs"
        >
          <option value="">-- Tous les capteurs --</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-container">
        {filteredTemps.length > 0 ? (
          <div className="scrollable-table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Sonde</th>
                  <th>Température (°C)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemps.map((temp) => {
                  const { localDate, localTime } = formatDateTime(temp.timestamp);

                  return (
                    <tr key={temp.id}>
                      <td>{localDate}</td>
                      <td>{localTime}</td>
                      <td>{temp.sensor_name}</td>
                      <td>{(temp.value / 10).toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-data-msg">
            <p>Pas de données à afficher pour cette période.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemperatureTable;