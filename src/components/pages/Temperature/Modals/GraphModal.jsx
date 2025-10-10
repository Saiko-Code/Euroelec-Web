import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
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

const toInputDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return isNaN(d) ? "" : d.toISOString().split("T")[0];
};

const GraphModal = ({
  isSingleDate,
  selectedSingleDate,
  setSelectedSingleDate,
  selectedStartDate,
  setSelectedStartDate,
  selectedEndDate,
  setSelectedEndDate,
  sensorsList = [],
  sensorVisibility = {},
  toggleSensorVisibility,
  tempsToDisplay = [],
  setShowGraphModal,
}) => {
  // Nettoyage et formatage des données
  const chartData = useMemo(() => {
    const baseData = prepareChartData(tempsToDisplay, isSingleDate) || [];
    // Convertir en valeurs numériques et filtrer les NaN
    return baseData.map((row) => {
      const cleaned = {};
      Object.entries(row).forEach(([key, value]) => {
        cleaned[key] =
          typeof value === "number"
            ? value
            : !isNaN(parseFloat(value))
            ? parseFloat(value)
            : null;
      });
      return cleaned;
    });
  }, [tempsToDisplay, isSingleDate]);

  return (
    <div className="modal-overlay graph-modal">
      <div
        className="modal-content graph-modal-content"
        style={{ height: "75vh", width: "90vw" }}
      >
        {/* === HEADER AVEC SÉLECTEUR DE DATE === */}
        <div
          className="modal-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            padding: "10px 20px",
          }}
        >
          <h3 style={{ margin: 0 }}>Graphique en grand</h3>

          <div
            className="date-selector"
            style={{ display: "flex", gap: "10px", alignItems: "center" }}
          >
            {isSingleDate ? (
              <>
                <label>Date :</label>
                <input
                  type="date"
                  value={toInputDate(selectedSingleDate)}
                  onChange={(e) => setSelectedSingleDate(e.target.value)}
                />
              </>
            ) : (
              <>
                <label>Du :</label>
                <input
                  type="date"
                  value={toInputDate(selectedStartDate)}
                  onChange={(e) => setSelectedStartDate(e.target.value)}
                />
                <label>au :</label>
                <input
                  type="date"
                  value={toInputDate(selectedEndDate)}
                  onChange={(e) => setSelectedEndDate(e.target.value)}
                />
              </>
            )}
          </div>

          <button
            className="close-modal"
            onClick={() => setShowGraphModal(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#666",
            }}
          >
            ×
          </button>
        </div>

        {/* === CONTROLES DES CAPTEURS === */}
        <div className="chart-controls">
          <div className="sensor-visibility-controls">
            <span className="sensor-visibility-label">
              Sélectionnez les capteurs :
            </span>
            <div className="sensor-buttons-container">
              {sensorsList.map((sensor) => (
                <button
                  key={sensor}
                  className={`sensor-toggle-btn ${
                    sensorVisibility[sensor] ? "active" : ""
                  }`}
                  onClick={() => toggleSensorVisibility(sensor)}
                >
                  {sensor}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* === GRAPHIQUE === */}
        <div className="modal-body" style={{ flex: 1, minHeight: "60vh" }}>
          <ResponsiveContainer width="100%" height="100%">
            {isSingleDate ? (
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="heure"
                  angle={-30}
                  textAnchor="end"
                  height={40}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  label={{
                    value: "Température (°C)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "14px" }} />

                {Object.entries(sensorVisibility)
                  .filter(([_, visible]) => visible)
                  .map(([sensor], idx) => (
                    <Line
                      key={sensor}
                      type="monotone"
                      dataKey={sensor}
                      name={sensor}
                      stroke={colors[idx % colors.length]}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                      strokeWidth={2}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}

                {/* Courbe extérieure si disponible */}
                {chartData[0]?.exterior !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="exterior"
                    name="Extérieur"
                    stroke="#FF0000"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                )}
              </LineChart>
            ) : (
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  angle={-30}
                  textAnchor="end"
                  height={50}
                  tickFormatter={(tick) =>
                    new Date(tick).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    })
                  }
                />
                <YAxis
                  domain={["auto", "auto"]}
                  label={{
                    value: "Température (°C)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: "14px" }} />

                {Object.entries(sensorVisibility)
                  .filter(([_, visible]) => visible)
                  .map(([sensor], idx) => (
                    <Bar
                      key={sensor}
                      dataKey={sensor}
                      name={sensor}
                      fill={colors[idx % colors.length]}
                      barSize={20}
                      isAnimationActive={false}
                    />
                  ))}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GraphModal;
