import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Sidebar from "../../layouts/sidebar";
import GraphCard from "./Temperature/GraphCard";
import TemperatureTable from "./Temperature/TemperatureTable";
import GraphModal from "./Temperature/Modals/GraphModal";
import TemperatureGlobal from "./Temperature/TemperatureGlobal";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/format";

const toISODate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const TemperaturePage = () => {
  const [archivedTemperatures, setArchivedTemperatures] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupVisibility, setGroupVisibility] = useState({});
  const [sensorVisibility, setSensorVisibility] = useState({});
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showDots, setShowDots] = useState(true);
  const [selectedFilterGroupId, setSelectedFilterGroupId] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  const firstLoad = useRef(true);

  // ---- DATES ----
  const [grIsSingleDate, setGrIsSingleDate] = useState(false);
  const [grStartDate, setGrStartDate] = useState("");
  const [grEndDate, setGrEndDate] = useState("");
  const [grSingleDate, setGrSingleDate] = useState("");

  // ---- FETCH TEMPÉRATURES ----
  const { fetchData: fetchTemperatures } = useFetch({
    url: "/temperature",
    onSuccess: (data) => {
      if (!data?.data) return;

      const formatted = data.data.map((item) => {
        const d = new Date(item.timestamp);
        return {
          ...item,
          isoDate: toISODate(d),
          formattedDate: formatDate(d, { year: "numeric", month: "2-digit", day: "2-digit" }),
        };
      });

      setArchivedTemperatures(formatted);

      const allSensors = Array.from(new Set(formatted.map((t) => t.sensor_name))).sort();
      setSensorVisibility(allSensors.reduce((acc, s) => ({ ...acc, [s]: true }), {}));

      if (firstLoad.current) {
        const today = toISODate(new Date());
        setGrStartDate(today);
        setGrEndDate(today);
        setGrSingleDate(today);
        firstLoad.current = false;
      }

      setLastUpdate(new Date());
    },
    onError: (err) => console.error("Erreur fetch /temperature :", err),
  });

  // ---- FETCH GROUPES ----
  const { fetchData: fetchGroups } = useFetch({
    url: "/sensor-groups",
    onSuccess: (data) => {
      if (!data?.data) return;
      setGroups(data.data);
    },
    onError: (err) => console.error("Erreur fetch /sensor-groups :", err),
  });

  // ---- INIT ----
  useEffect(() => {
    fetchTemperatures();
    fetchGroups();
  }, []);

  // ---- INITIALISER VISIBILITÉ GROUPES ----
  useEffect(() => {
    if (groups.length) {
      setGroupVisibility(groups.reduce((acc, g) => ({ ...acc, [g.id]: true }), {}));
    }
  }, [groups]);

  // ---- TOGGLES ----
  const toggleGroupVisibility = useCallback(
    (groupId) => setGroupVisibility((prev) => ({ ...prev, [groupId]: !prev[groupId] })),
    []
  );

  const toggleSensorVisibility = useCallback(
    (sensor) => setSensorVisibility((prev) => ({ ...prev, [sensor]: !prev[sensor] })),
    []
  );

  // ---- TEMPÉRATURES FILTRÉES ----
  const tempsToDisplay = useMemo(() => {
    if (!archivedTemperatures.length) return [];

    let filtered = grIsSingleDate
      ? archivedTemperatures.filter((t) => t.isoDate === grSingleDate)
      : archivedTemperatures.filter((t) => t.isoDate >= grStartDate && t.isoDate <= grEndDate);

    const visibleSensors = groups
      .filter((g) => groupVisibility[g.id])
      .flatMap((g) => g.sensors || []);

    return filtered.filter((t) => visibleSensors.includes(t.sensor_name));
  }, [archivedTemperatures, grIsSingleDate, grStartDate, grEndDate, grSingleDate, groups, groupVisibility]);

  // ---- LISTE CAPTEURS ----
  const sensorsList = useMemo(
    () => Array.from(new Set(tempsToDisplay.map((t) => t.sensor_name))).sort(),
    [tempsToDisplay]
  );

  // ---- RENDU ----
  return (
    <div className="temperature-container">
      <Sidebar />
      <div className="main-content">
        <h1 className="section-title">Monitoring des températures</h1>

        <div className="cards-container mt-6">
          {/* Card globale avec stats (moyenne, min, max, écart) */}
          <TemperatureGlobal 
            tempsToDisplay={tempsToDisplay}
            groups={groups}
            selectedFilterGroupId={selectedFilterGroupId}
            setSelectedFilterGroupId={setSelectedFilterGroupId} />
          

          {/* Graphique interactif */}
          <GraphCard
            isSingleDate={grIsSingleDate}
            setIsSingleDate={setGrIsSingleDate}
            selectedStartDate={grStartDate}
            setSelectedStartDate={setGrStartDate}
            selectedEndDate={grEndDate}
            setSelectedEndDate={setGrEndDate}
            selectedSingleDate={grSingleDate}
            setSelectedSingleDate={setGrSingleDate}
            tempsToDisplay={tempsToDisplay}
            groups={groups}
            groupVisibility={groupVisibility}
            toggleGroupVisibility={toggleGroupVisibility}
            sensorsList={sensorsList}
            sensorVisibility={sensorVisibility}
            toggleSensorVisibility={toggleSensorVisibility}
            showDots={showDots}
            setShowGraphModal={setShowGraphModal}
          />

          {/* Tableau de températures */}
          <TemperatureTable
            tempsToDisplay={tempsToDisplay}
            groups={groups}
            selectedFilterGroupId={selectedFilterGroupId}
            setSelectedFilterGroupId={setSelectedFilterGroupId}
          />
        </div>

        {/* Modal */}
        {showGraphModal && (
          <GraphModal
            isSingleDate={grIsSingleDate}
            sensorsList={sensorsList}
            sensorVisibility={sensorVisibility}
            toggleSensorVisibility={toggleSensorVisibility}
            tempsToDisplay={tempsToDisplay}
            setShowGraphModal={setShowGraphModal}
            groups={groups}
            groupVisibility={groupVisibility}
            toggleGroupVisibility={toggleGroupVisibility}
          />
        )}

        {/* Dernière mise à jour */}
        {lastUpdate && (
          <div className="last-update">
            Dernière mise à jour : {formatDate(lastUpdate, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemperaturePage;
