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

const SensorLine = React.memo(({ sensor, color }) => (
  <Line
    type="natural"
    dataKey={sensor}
    name={sensor}
    stroke={color}
    dot={{ r: 4 }}
    activeDot={{ r: 6 }}
    connectNulls
    isAnimationActive={false}
  />
));

const SensorBar = React.memo(({ sensor, color }) => (
  <Bar
    dataKey={sensor}
    name={sensor}
    fill={color}
    barSize={20}
    isAnimationActive={false}
  />
));

const GraphCard = React.memo(
  ({
    isSingleDate = false,
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
    // Filtrage des données selon la sélection
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

    const visibleSensors = useMemo(
      () => Object.entries(sensorVisibility).filter(([, v]) => v),
      [sensorVisibility]
    );

    const hasData = chartData.length > 0 && sensorsList.length > 0;

    return (
      <div className="graph-card">
        <div className="card-container custom-card full-width" style={{ minHeight: "580px" }}>
<div className="custom-card-header-graph">
  <div className="graph-title-container">
    <h3>Graphique des températures</h3>
    <div className="date-selector-container">
      {isSingleDate ? (
        <div className="single-date-field">
          <div className="date-input-container">
            <label htmlFor="single-date">Date :</label>
            <input
              id="single-date"
              type="date"
              value={toInputDate(selectedSingleDate)}
              onChange={(e) => setSelectedSingleDate?.(e.target.value)}
              className="date-input"
            />
          </div>
        </div>
      ) : (
        <div className="date-range-container">
          <div className="date-range-fields">
            <div className="date-input-container">
              <label htmlFor="start-date">Date de début :</label>
              <input
                id="start-date"
                type="date"
                value={toInputDate(selectedStartDate)}
                onChange={(e) => setSelectedStartDate?.(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-container">
              <label htmlFor="end-date">Date de fin :</label>
              <input
                id="end-date"
                type="date"
                value={toInputDate(selectedEndDate)}
                onChange={(e) => setSelectedEndDate?.(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>


          <div className="custom-card-body chart-container" style={{ height: 520 }}>
            {hasData ? (
              <>
                <div className="chart-header-container">
                  <h3 className="chart-title">
                    {isSingleDate
                      ? `Températures du ${selectedSingleDate}`
                      : `Températures du ${selectedStartDate} au ${selectedEndDate}`}
                  </h3>

                  <div className="chart-controls">
                    <div className="sensor-visibility-controls">
                      <span className="sensor-visibility-label">Capteurs visibles :</span>
                      <div className="sensor-buttons-container">
                        {sensorsList.sort().map((sensor) => (
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
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  {isSingleDate ? (
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="heure"
                        label={{ value: "Heure", position: "insideBottom", offset: -5 }}
                        angle={-30}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        label={{ value: "Température (°C)", angle: -90, position: "insideLeft" }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "14px" }} />
                      {visibleSensors.map(([sensor], idx) => (
                        <SensorLine key={sensor} sensor={sensor} color={colors[idx % colors.length]} />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        label={{ value: "Date", position: "insideBottom", offset: -5 }}
                        angle={-30}
                        textAnchor="end"
                        height={80}
                        tickFormatter={(tick) =>
                          new Date(tick).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                        }
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        label={{ value: "Température (°C)", angle: -90, position: "insideLeft" }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "14px" }} />
                      {visibleSensors.map(([sensor], idx) => (
                        <SensorBar key={sensor} sensor={sensor} color={colors[idx % colors.length]} />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </>
            ) : (
              <p className="no-data-msg">Pas de données disponibles pour générer le graphique.</p>
            )}

            <button className="custom-btn blue" style={{ marginTop: "15px" }} onClick={() => setShowGraphModal?.(true)}>
              Agrandir le graphique
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default GraphCard;
