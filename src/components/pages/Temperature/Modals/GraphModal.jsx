import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { prepareChartData } from "../../../../utils/prepareChartData";

const colors = [
  "rgba(52, 152, 219, 0.8)",
  "rgba(255, 163, 43, 0.8)",
  "rgba(46, 204, 113, 0.8)",
  "rgba(155, 89, 182, 0.8)",
  "rgba(241, 196, 15, 0.8)",
  "rgba(26, 188, 156, 0.8)",
  "rgba(230, 126, 34, 0.8)",
  "rgba(149, 165, 166, 0.8)",
  "rgba(127, 140, 141, 0.8)",
  "rgba(243, 94, 193, 0.8)",
];

const GraphModal = ({
  isSingleDate,
  sensorsList,
  sensorVisibility,
  toggleSensorVisibility,
  tempsToDisplay,
  setShowGraphModal,
}) => {
  return (
    <div className="modal-overlay graph-modal">
      <div className="modal-content graph-modal-content" style={{ height: "70vh" }}>
        <div className="modal-header">
          <h3>Graphique en grand</h3>
          <button className="close-modal" onClick={() => setShowGraphModal(false)}>
            ×
          </button>
        </div>
        <div className="chart-controls">
          <div className="sensor-visibility-controls">
            <span className="sensor-visibility-label">Sélectionnez les capteurs à afficher :</span>
            <div className="sensor-buttons-container">
              {sensorsList.map((sensor) => (
                <button
                  key={sensor}
                  className={`sensor-toggle-btn ${sensorVisibility[sensor] ? "active" : ""}`}
                  onClick={() => toggleSensorVisibility(sensor)}
                >
                  {sensor}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-body" style={{ height: "60vh", width: "85vw" }}>
          <ResponsiveContainer width="100%" height="100%">
            {isSingleDate ? (
              <LineChart data={prepareChartData(tempsToDisplay, isSingleDate)} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="heure"
                  label={{ value: "Heure", position: "insideBottom", offset: -5 }}
                  angle={-30}
                  textAnchor="end"
                  height={20}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  label={{ value: "Température (°C)", angle: -90, position: "insideLeft" }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "14px" }} />
                {Object.entries(sensorVisibility)
                  .filter(([_, isVisible]) => isVisible)
                  .map(([sensor, _], idx) => (
                    <Line
                      key={sensor}
                      type="monotone"
                      dataKey={sensor}
                      name={sensor}
                      stroke={colors[idx % colors.length]}
                      dot={false}
                    />
                  ))}
                <Line type="monotone" dataKey="exterior" name="Extérieur" stroke="#FF0000" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={prepareChartData(tempsToDisplay, isSingleDate)} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  label={{ value: "Date", position: "insideBottom", offset: -5 }}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                  tickFormatter={(tick) => {
                    const date = new Date(tick);
                    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
                  }}
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  label={{ value: "Température (°C)", angle: -90, position: "insideLeft" }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: "14px" }} />
                {Object.entries(sensorVisibility)
                  .filter(([_, isVisible]) => isVisible)
                  .map(([sensor, _], idx) => (
                    <Bar
                      key={sensor}
                      dataKey={sensor}
                      name={sensor}
                      fill={colors[idx % colors.length]}
                      barSize={20}
                    />
                  ))}
                <Line dataKey="exterior" name="Extérieur" stroke="#FF0000" strokeWidth={2.5} dot={false} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GraphModal;
