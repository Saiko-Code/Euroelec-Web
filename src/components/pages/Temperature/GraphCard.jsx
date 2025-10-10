import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { prepareChartData } from "../../../utils/prepareChartData";

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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "6px",
        fontSize: "13px",
      }}
    >
      <p><strong>{label}</strong></p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: 0 }}>
          {p.name}: {p.value ?? "-"}
        </p>
      ))}
    </div>
  );
};

const GraphCard = React.memo(
  ({
    isSingleDate = true,
    selectedSingleDate,
    setSelectedSingleDate,
    selectedStartDate,
    setSelectedStartDate,
    selectedEndDate,
    setSelectedEndDate,
    groups = [],
    groupVisibility = {},
    toggleGroupVisibility,
    tempsToDisplay = [],
    setShowGraphModal,
  }) => {
    const filteredData = useMemo(() => {
      if (!tempsToDisplay.length) return [];
      return isSingleDate
        ? tempsToDisplay.filter((t) => t.isoDate === selectedSingleDate)
        : tempsToDisplay.filter(
            (t) => t.isoDate >= selectedStartDate && t.isoDate <= selectedEndDate
          );
    }, [tempsToDisplay, isSingleDate, selectedSingleDate, selectedStartDate, selectedEndDate]);

    const chartData = useMemo(
      () => prepareChartData(filteredData, isSingleDate),
      [filteredData, isSingleDate]
    );

    const visibleSensors = useMemo(() => {
      return groups
        .filter((g) => groupVisibility[g.id])
        .flatMap((g) => g.sensors.map((s) => ({ group: g.name, sensor: s })));
    }, [groups, groupVisibility]);

    const hasData = chartData.length > 0 && visibleSensors.length > 0;

    return (
      <div className="graph-card">
        <div className="card-container custom-card full-width" style={{ minHeight: "650px" }}>
          {/* === HEADER === */}
          <div
            className="custom-card-header-graph"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              padding: "15px 20px",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <h3 style={{ margin: 0 }}>📈 Graphique des températures</h3>

            {/* Sélecteur de date */}
            <div
              className="date-selector"
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {isSingleDate ? (
                <>
                  <label>Date :</label>
                  <input
                    type="date"
                    value={toInputDate(selectedSingleDate)}
                    onChange={(e) => setSelectedSingleDate(e.target.value)}
                    className="date-input"
                  />
                </>
              ) : (
                <>
                  <label>Du :</label>
                  <input
                    type="date"
                    value={toInputDate(selectedStartDate)}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    className="date-input"
                  />
                  <label>Au :</label>
                  <input
                    type="date"
                    value={toInputDate(selectedEndDate)}
                    onChange={(e) => setSelectedEndDate(e.target.value)}
                    className="date-input"
                  />
                </>
              )}
            </div>
          </div>

          {/* === CONTROLES (Boutons de groupe + bouton agrandir) === */}
          <div
            className="group-controls"
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              padding: "12px 20px",
              background: "#f9f9f9",
              borderBottom: "1px solid #eee",
            }}
          >
            <span style={{ fontWeight: "600" }}>Groupes visibles :</span>
            {groups.map((group) => (
              <button
                key={group.id}
                className={`sensor-toggle-btn ${groupVisibility[group.id] ? "active" : ""}`}
                onClick={() => toggleGroupVisibility(group.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid #ccc",
                  background: groupVisibility[group.id] ? "#2c82c9" : "#fff",
                  color: groupVisibility[group.id] ? "#fff" : "#333",
                  cursor: "pointer",
                  fontSize: "13px",
                  transition: "all 0.2s ease",
                }}
              >
                {group.name}
              </button>
            ))}

            {/* Bouton d'agrandissement aligné à droite */}
            <div style={{ marginLeft: "auto" }}>
              <button
                className="custom-btn blue"
                onClick={() => setShowGraphModal?.(true)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: "#2c82c9",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background 0.2s",
                }}
              >
                🔍 Agrandir le graphique
              </button>
            </div>
          </div>

          {/* === GRAPHIQUE === */}
          <div className="custom-card-body chart-container" style={{ height: 480 }}>
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                {isSingleDate ? (
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="heure"
                      angle={-30}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    {visibleSensors.map((sensorObj, idx) => (
                      <Line
                        key={sensorObj.sensor}
                        type="monotone"
                        dataKey={sensorObj.sensor}
                        name={`${sensorObj.group} - ${sensorObj.sensor}`}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      angle={-30}
                      textAnchor="end"
                      height={70}
                      tickFormatter={(tick) =>
                        new Date(tick).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })
                      }
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    {visibleSensors.map((sensorObj, idx) => (
                      <Bar
                        key={sensorObj.sensor}
                        dataKey={sensorObj.sensor}
                        name={`${sensorObj.group} - ${sensorObj.sensor}`}
                        fill={colors[idx % colors.length]}
                        barSize={20}
                        isAnimationActive={false}
                      />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <p className="no-data-msg" style={{ textAlign: "center", marginTop: "50px" }}>
                ⚠️ Pas de données disponibles pour la date sélectionnée.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default GraphCard;
