import React, { useMemo, useState, useEffect } from "react";
import { FiThermometer, FiActivity, FiSun } from "react-icons/fi";

/**
 * TemperatureGlobal
 * - utilise la DERNIERE lecture par capteur (par timestamp) pour calculer les stats intérieures
 * - calcule la température extérieure à partir des dernières lectures des sondes du groupe extérieur
 * - déclenche une alerte si la moyenne intérieure > température extérieure
 */
const TemperatureGlobal = ({ tempsToDisplay = [], groups = [] }) => {
  const [outdoorGroupId, setOutdoorGroupId] = useState(null);

  useEffect(() => {
    if (!outdoorGroupId && groups.length) {
      setOutdoorGroupId(groups[0].id);
    }
  }, [groups, outdoorGroupId]);

  const { stats, outdoor, alertActive } = useMemo(() => {
    // si pas de données, renvoyer valeurs par défaut
    if (!tempsToDisplay || !tempsToDisplay.length) {
      return {
        stats: { avg: null, min: null, max: null, trend: 0, trendPercent: 0, alerts: [], activeCount: 0 },
        outdoor: null,
        alertActive: false,
      };
    }

    // Normalisation des températures
    const normalized = tempsToDisplay
      .map(t => {
        const raw = t.temperature ?? t.temp ?? t.temp_value ?? t.value;
        let temp = parseFloat(raw);
        if (!isNaN(temp) && temp > 100) temp = temp / 10;
        // garder la timestamp brute (on parseera), et un identifiant capteur
        return { ...t, temperature: temp, timestamp: t.timestamp ?? t.time ?? t.date };
      })
      .filter(t => !isNaN(t.temperature) && t.timestamp);

    if (!normalized.length) {
      return {
        stats: { avg: null, min: null, max: null, trend: 0, trendPercent: 0, alerts: [], activeCount: 0 },
        outdoor: null,
        alertActive: false,
      };
    }

    // Trier par timestamp décroissante (plus récent d'abord)
    normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Construire le dernier relevé par capteur (clé: sensor_name ou sensor_id)
    const latestBySensor = new Map();
    for (const rec of normalized) {
      const key = rec.sensor_name ?? rec.sensor_id ?? `${rec.sensor ?? "unknown"}`;
      if (!latestBySensor.has(key)) {
        latestBySensor.set(key, rec); // le premier rencontré est le plus récent (on a trié)
      }
    }

    // Groupe des sondes extérieures (set pour lookup rapide)
    const outdoorSensorsSet = new Set(groups.find(g => g.id === outdoorGroupId)?.sensors || []);

    // Séparer dernières lectures indoor / outdoor
    const indoorLatest = [];
    const outdoorLatest = [];
    for (const [name, rec] of latestBySensor.entries()) {
      if (outdoorSensorsSet.has(name)) outdoorLatest.push(rec);
      else indoorLatest.push(rec);
    }

    // Si aucun capteur intérieur dans latest (ex : tout en outdoor), on pourra fallback sur latestBySensor values as indoor (optionnel)
    // Ici on laisse indoorLatest vide => stats par défaut gérées ci-dessous

    const computeStatsFromLatest = (arr) => {
      if (!arr || !arr.length) {
        return { avg: 0, min: 0, max: 0, trend: 0, trendPercent: 0, alerts: [], activeCount: 0 };
      }
      const temps = arr.map(r => r.temperature);
      const avg = temps.reduce((s, v) => s + v, 0) / temps.length;
      const min = Math.min(...temps);
      const max = Math.max(...temps);

      // tendance simple : comparer moyenne des 2 plus récentes / 2 plus anciennes si possible
      const sortedByTime = [...arr].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const recentCount = Math.min(4, sortedByTime.length);
      const half = Math.floor(recentCount / 2) || 1;
      const oldVals = sortedByTime.slice(0, half).map(r => r.temperature);
      const newVals = sortedByTime.slice(-half).map(r => r.temperature);
      const oldAvg = oldVals.reduce((s, v) => s + v, 0) / oldVals.length;
      const newAvg = newVals.reduce((s, v) => s + v, 0) / newVals.length;
      const trend = newAvg - oldAvg;
      const trendPercent = oldAvg ? (trend / oldAvg) * 100 : 0;

      const alerts = [];
      if (max > 30) alerts.push({ type: "high", message: "Température élevée", value: max });
      if (min < 10) alerts.push({ type: "low", message: "Température basse", value: min });

      const activeCount = arr.length;

      return {
        avg: avg.toFixed(1),
        min: min.toFixed(1),
        max: max.toFixed(1),
        trend: trend.toFixed(1),
        trendPercent: trendPercent.toFixed(1),
        alerts,
        activeCount,
      };
    };

    const indoorStats = computeStatsFromLatest(indoorLatest);
    const outdoorTemp =
      outdoorLatest.length > 0
        ? (outdoorLatest.reduce((s, r) => s + r.temperature, 0) / outdoorLatest.length).toFixed(1)
        : null;

    const alertActive = outdoorTemp && indoorStats.avg !== null && parseFloat(indoorStats.avg) > parseFloat(outdoorTemp);

    return {
      stats: indoorStats,
      outdoor: outdoorTemp ? { temperature: outdoorTemp } : null,
      alertActive,
    };
  }, [tempsToDisplay, groups, outdoorGroupId]);

  if (!tempsToDisplay || !tempsToDisplay.length) return <div>Aucune donnée disponible</div>;

  return (
    <div className="stats-widget-card">
      <div className={`custom-card ${alertActive ? "card-warning" : ""}`}>
        <div className="custom-card-header flex justify-between items-center">
          <div className="flex items-center gap-2">
            🌡️ Statistique température
          </div>
          <div className="sensor-badge">
            <FiActivity size={14} /> {stats.activeCount} capteur{stats.activeCount > 1 ? "s" : ""}
          </div>
        </div>

        <div className="custom-card-body">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Moyenne</div>
              <div className="stat-value stat-value-primary">{stats.avg}°C</div>
              <div className="stat-desc">Moyenne (dernières lectures par capteur)</div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Min</div>
              <div className="stat-value stat-value-cool">{stats.min}°C</div>
              <div className="stat-desc">Plus basse (dernières lectures par capteur)</div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Max</div>
              <div className="stat-value stat-value-hot">{stats.max}°C</div>
              <div className="stat-desc">Plus haute (dernières lectures par capteur)</div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Écart</div>
              <div className="stat-value">{(parseFloat(stats.max) - parseFloat(stats.min)).toFixed(1)}°C</div>
              <div className="stat-desc">Max - Min (dernières lectures)</div>
            </div>
          </div>

          {alertActive && <div className="alert-item">🚨 La température intérieure dépasse l'extérieur !</div>}

          {outdoor && (
            <div className="outdoor-section mt-4 flex items-center gap-2">
              ☀️ 
              <span> Température extérieure : </span>
              <span className="font-semibold">{outdoor.temperature}°C</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemperatureGlobal;
