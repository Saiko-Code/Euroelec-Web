import React, { useMemo, useState, useEffect } from "react";
import { FiActivity } from "react-icons/fi";

/** Calcule des statistiques sur un tableau de relevés */
function computeStats(readings = []) {
  if (!readings.length)
    return { avg: null, min: null, max: null, trend: 0, trendPercent: 0, alerts: [], activeCount: 0 };

  const temps = readings.map(r => r.temperature);
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
  const min = Math.min(...temps);
  const max = Math.max(...temps);

  // tendance : moyenne ancienne vs récente
  const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const half = Math.max(1, Math.floor(sorted.length / 2));
  const oldAvg = sorted.slice(0, half).reduce((s, r) => s + r.temperature, 0) / half;
  const newAvg = sorted.slice(-half).reduce((s, r) => s + r.temperature, 0) / half;
  const trend = newAvg - oldAvg;
  const trendPercent = oldAvg ? (trend / oldAvg) * 100 : 0;

  const alerts = [];
  if (max > 30) alerts.push({ type: "high", message: "Température élevée", value: max });
  if (min < 10) alerts.push({ type: "low", message: "Température basse", value: min });

  return {
    avg: avg.toFixed(1),
    min: min.toFixed(1),
    max: max.toFixed(1),
    trend: trend.toFixed(1),
    trendPercent: trendPercent.toFixed(1),
    alerts,
    activeCount: readings.length,
  };
}

/** Normalise les lectures brutes */
function normalizeTemps(data = []) {
  return data
    .map(t => {
      const raw = t.temperature ?? t.temp ?? t.temp_value ?? t.value;
      let temp = parseFloat(raw);
      if (!isNaN(temp) && temp > 100) temp /= 10;
      const timestamp = t.timestamp ?? t.time ?? t.date;
      return { ...t, temperature: temp, timestamp };
    })
    .filter(t => !isNaN(t.temperature) && t.timestamp);
}

/** Composant principal */
const TemperatureGlobal = ({ tempsToDisplay = [], groups = [] }) => {
  const [outdoorGroupId, setOutdoorGroupId] = useState(null);

  useEffect(() => {
    if (!outdoorGroupId && groups.length) setOutdoorGroupId(groups[0].id);
  }, [groups, outdoorGroupId]);

  const { stats, outdoor, alertActive } = useMemo(() => {
    const normalized = normalizeTemps(tempsToDisplay);
    if (!normalized.length)
      return { stats: computeStats([]), outdoor: null, alertActive: false };

    // Trier du plus récent au plus ancien
    normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Dernier relevé par capteur
    const latestBySensor = new Map();
    for (const r of normalized) {
      const key = r.sensor_name ?? r.sensor_id ?? r.sensor ?? "unknown";
      if (!latestBySensor.has(key)) latestBySensor.set(key, r);
    }

    const outdoorSensors = new Set(groups.find(g => g.id === outdoorGroupId)?.sensors || []);
    const indoor = [];
    const outdoorArr = [];

    for (const rec of latestBySensor.values()) {
      (outdoorSensors.has(rec.sensor_name) || outdoorSensors.has(rec.sensor_id))
        ? outdoorArr.push(rec)
        : indoor.push(rec);
    }

    const indoorStats = computeStats(indoor);
    const outdoorAvg = outdoorArr.length
      ? (outdoorArr.reduce((s, r) => s + r.temperature, 0) / outdoorArr.length).toFixed(1)
      : null;

    const alertActive =
      outdoorAvg && indoorStats.avg && parseFloat(indoorStats.avg) > parseFloat(outdoorAvg);

    return {
      stats: indoorStats,
      outdoor: outdoorAvg ? { temperature: outdoorAvg } : null,
      alertActive,
    };
  }, [tempsToDisplay, groups, outdoorGroupId]);

  if (!tempsToDisplay.length) return <div>Aucune donnée disponible</div>;

  const diff =
    stats.min && stats.max ? (parseFloat(stats.max) - parseFloat(stats.min)).toFixed(1) : null;

  return (
    <div className="stats-widget-card">
      <div className={`custom-card ${alertActive ? "card-warning" : ""}`}>
        <div className="custom-card-header flex justify-between items-center">
          <div className="flex items-center gap-2">🌡️ Statistique température</div>
          <div className="sensor-badge">
            <FiActivity size={14} /> {stats.activeCount} capteur{stats.activeCount > 1 ? "s" : ""}
          </div>
        </div>

        <div className="custom-card-body">
          <div className="stats-grid">
            <Stat label="Moyenne" value={`${stats.avg}°C`} desc="Moyenne (dernières lectures)" className="stat-value-primary" />
            <Stat label="Min" value={`${stats.min}°C`} desc="Plus basse" className="stat-value-cool" />
            <Stat label="Max" value={`${stats.max}°C`} desc="Plus haute" className="stat-value-hot" />
            <Stat label="Écart" value={diff ? `${diff}°C` : "-"} desc="Max - Min" />
          </div>

          {alertActive && (
            <div className="alert-item">🚨 La température intérieure dépasse l'extérieur !</div>
          )}

          {outdoor && (
            <div className="outdoor-section mt-4 flex items-center gap-2">
              ☀️ <span>Température extérieure :</span>
              <span className="font-semibold">{outdoor.temperature}°C</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Sous-composant pour un bloc de statistique */
const Stat = ({ label, value, desc, className = "" }) => (
  <div className="stat-item">
    <div className="stat-label">{label}</div>
    <div className={`stat-value ${className}`}>{value}</div>
    <div className="stat-desc">{desc}</div>
  </div>
);

export default TemperatureGlobal;
