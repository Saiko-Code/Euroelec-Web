import React from "react";
import "../../../assets/styles/dashboard.css";

const TemperatureTable = ({
  tempsToDisplay = [],
  groups = [],
  selectedFilterGroupId,
  setSelectedFilterGroupId,
}) => {
  // Filtre par groupe si sélectionné
  const filteredTemps = selectedFilterGroupId
    ? tempsToDisplay.filter((t) => {
        const groupId = parseInt(selectedFilterGroupId, 10); // Assure que c'est un nombre
        const group = groups.find((g) => g.id === groupId);
        return group?.sensors?.includes(t.sensor_name);
      })
    : tempsToDisplay;

  return (
    <div className="temp-card">
      <div
        className="card-temp custom-card"
        style={{ width: "580px", height: "620px" }}
      >
        <div className="filter-by-group">
          <label htmlFor="filter-group-select">Filtrer par groupe :</label>
          <select
            id="filter-group-select"
            className="select-group"
            value={selectedFilterGroupId || ""}
            onChange={(e) => setSelectedFilterGroupId(e.target.value)}
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
                    const dateObj = new Date(temp.timestamp);
                    const localDate = `${dateObj.getFullYear()}-${String(
                      dateObj.getMonth() + 1
                    ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(
                      2,
                      "0"
                    )}`;
                    const localTime = `${String(dateObj.getHours()).padStart(
                      2,
                      "0"
                    )}:${String(dateObj.getMinutes()).padStart(2, "0")}`;

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
            <p className="no-data-msg">
              Pas de données à afficher pour cette période.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemperatureTable;
