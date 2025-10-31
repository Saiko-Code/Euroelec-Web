import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import Sidebar from "../../layouts/sidebar";
import GraphCard from "./Temperature/GraphCard";
import TemperatureTable from "./Temperature/TemperatureTable";
import GraphModal from "./Temperature/Modals/GraphModal";
import TemperatureGlobal from "./Temperature/TemperatureGlobal";
import useFetch from "../../hooks/useFetch";
import { formatDate } from "../../utils/format";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/styles/dashboard.css";

const toISODate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const TemperaturePage = () => {
  const [archivedTemperatures, setArchivedTemperatures] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupVisibility, setGroupVisibility] = useState({});
  const [sensorVisibility, setSensorVisibility] = useState({});
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [selectedFilterGroupId, setSelectedFilterGroupId] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          formattedDate: formatDate(d, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
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
  }, [fetchTemperatures, fetchGroups]);

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
    document.body.classList.toggle("menu-open", !isMobileMenuOpen);
  };

  // ---- TEMPÉRATURES FILTRÉES ----
  const tempsToDisplay = useMemo(() => {
    if (!archivedTemperatures.length) return [];

    let filtered = grIsSingleDate
      ? archivedTemperatures.filter((t) => t.isoDate === grSingleDate)
      : archivedTemperatures.filter(
          (t) => t.isoDate >= grStartDate && t.isoDate <= grEndDate
        );

    const visibleSensors = groups
      .filter((g) => groupVisibility[g.id])
      .flatMap((g) => g.sensors || []);

    return filtered.filter((t) => visibleSensors.includes(t.sensor_name));
  }, [
    archivedTemperatures,
    grIsSingleDate,
    grStartDate,
    grEndDate,
    grSingleDate,
    groups,
    groupVisibility,
  ]);

  // ---- LISTE CAPTEURS ----
  const sensorsList = useMemo(
    () => Array.from(new Set(tempsToDisplay.map((t) => t.sensor_name))).sort(),
    [tempsToDisplay]
  );

  // ---- RENDU ----
  return (
    <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
      <div className="main-content">
        <div className="temperature-container container-fluid py-2">
          {/* ======== Bouton menu mobile ======== */}
          <button
            className="mobile-menu-btn d-md-none position-fixed top-0 start-0 m-3"
            onClick={toggleMobileMenu}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <h1 className="section-title text-center mb-3">
            Monitoring des températures
          </h1>

          <div className="row g-3">
            {/* ======== Graphique (masqué sur mobile) ======== */}
            <div className="col-12 d-none d-md-block">
              <div className="custom-card">
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
                    setShowGraphModal={setShowGraphModal}
                  />
              </div>
            </div>

            {/* ======== Carte statistiques globales ======== */}
            <div className="col-12 col-md-12 col-xl-4">
              <div className="custom-card">
                  <TemperatureGlobal
                    tempsToDisplay={tempsToDisplay}
                    groups={groups}
                    selectedFilterGroupId={selectedFilterGroupId}
                    setSelectedFilterGroupId={setSelectedFilterGroupId}
                  />
              </div>
            </div>

            {/* ======== Tableau ======== */}
            <div className="col-12 col-md-12 col-xl-8">
              <div className="custom-card">
                  <TemperatureTable
                    tempsToDisplay={tempsToDisplay}
                    groups={groups}
                    selectedFilterGroupId={selectedFilterGroupId}
                    setSelectedFilterGroupId={setSelectedFilterGroupId}
                  />
              </div>
            </div>
          </div>

          {/* ======== Modal Graphique ======== */}
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

          {/* ======== Dernière mise à jour ======== */}
          {lastUpdate && (
            <div className="text-center last-update mt-4">
              Dernière mise à jour :{" "}
              {formatDate(lastUpdate, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default TemperaturePage;
