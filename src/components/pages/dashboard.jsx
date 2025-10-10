import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FaBell } from "react-icons/fa";
import Sidebar from "../../layouts/sidebar";
import DownloadCard from "./Temperature/DownloadCard";
import GroupCard from "./Temperature/GroupCard";
import ProgramCard from "./Temperature/ProgramCard";
import ProgramModal from "./Temperature/Modals/ProgramModal";
import AllProgramsModal from "./Temperature/Modals/AllProgramsModal";
import GraphModal from "./Temperature/Modals/GraphModal";
import useFetch from "../../hooks/useFetch";
import useNotification from "../../hooks/useNotification";
import { formatDate } from "../../utils/format";
import "../../assets/styles/dashboard.css";

const toISODate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const TemperatureCards = () => {
  const [archivedTemperatures, setArchivedTemperatures] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupVisibility, setGroupVisibility] = useState({});
  const [sensorVisibility, setSensorVisibility] = useState({});

  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showAllProgramsModal, setShowAllProgramsModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [progression, setProgression] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // DownloadCard dates
  const [dlIsSingleDate, setDlIsSingleDate] = useState(false);
  const [dlStartDate, setDlStartDate] = useState("");
  const [dlEndDate, setDlEndDate] = useState("");
  const [dlSingleDate, setDlSingleDate] = useState("");

  // GraphCard dates
  const [grIsSingleDate, setGrIsSingleDate] = useState(false);
  const [grStartDate, setGrStartDate] = useState("");
  const [grEndDate, setGrEndDate] = useState("");
  const [grSingleDate, setGrSingleDate] = useState("");

  const firstLoad = useRef(true);
  const { notification, setNotification } = useNotification();

  // ✅ Fetch températures
  const { fetchData: fetchTemperatures } = useFetch({
    url: "/temperature",
    onSuccess: (data) => {
      const formatted = data.data.map((item) => {
        const d = new Date(item.timestamp);
        return {
          ...item,
          isoDate: toISODate(d),
          formattedDate: formatDate(d, { year: "numeric", month: "2-digit", day: "2-digit" }),
        };
      });
      setArchivedTemperatures(formatted);

      // Tous les capteurs
      const allSensors = Array.from(new Set(formatted.map((t) => t.sensor_name))).sort();
      setSensorVisibility(allSensors.reduce((acc, s) => ({ ...acc, [s]: true }), {}));

      // Première initialisation
      if (firstLoad.current) {
        const today = toISODate(new Date());
        setDlStartDate(today);
        setDlEndDate(today);
        setDlSingleDate(today);
        setGrStartDate(today);
        setGrEndDate(today);
        setGrSingleDate(today);
        firstLoad.current = false;
      }

      setLastUpdate(new Date());
    },
    onError: (err) => console.error(err),
  });

  // ✅ Fetch groupes
  const { fetchData: fetchGroups } = useFetch({
    url: "/sensor-groups",
    onSuccess: (data) => setGroups(data.data),
    onError: (err) => console.error(err),
  });

  // ✅ Fetch programmes
  const { fetchData: fetchPrograms } = useFetch({
    url: "/air-program",
    onSuccess: (data) => {
      const allPrograms = [
        ...(data.singleDay || []).map((p) => ({
          id: `single-${p.id}`,
          name: p.name,
          day: p.day,
          start: p.start_time,
          end: p.end_time,
          action: p.action,
          is_active: p.is_active || 0,
          isMultiDay: false,
        })),
        ...(data.multiDay || []).map((p) => ({
          id: `multi-${p.id}`,
          name: p.name,
          startDay: p.startDay,
          endDay: p.endDay,
          start: p.startTime,
          end: p.endTime,
          action: p.action,
          is_active: p.is_active || 0,
          isMultiDay: true,
        })),
      ];
      setSchedule(allPrograms);
    },
    onError: (err) => console.error(err),
  });

  // ✅ Chargement initial
  useEffect(() => {
    fetchTemperatures();
    fetchGroups();
    fetchPrograms();
  }, [fetchTemperatures, fetchGroups, fetchPrograms]);

  // ✅ Initialisation de la visibilité des groupes
  useEffect(() => {
    if (groups.length) {
      setGroupVisibility(groups.reduce((acc, g) => ({ ...acc, [g.id]: true }), {}));
    }
  }, [groups]);

  // ✅ Fonctions de toggles
  const toggleGroupVisibility = useCallback(
    (groupId) => setGroupVisibility((prev) => ({ ...prev, [groupId]: !prev[groupId] })),
    []
  );

  const toggleSensorVisibility = useCallback(
    (sensor) => setSensorVisibility((prev) => ({ ...prev, [sensor]: !prev[sensor] })),
    []
  );

  // ✅ Températures à afficher (graph)
  const tempsToDisplay = useMemo(() => {
    if (!archivedTemperatures.length) return [];

    let filtered = grIsSingleDate
      ? archivedTemperatures.filter((t) => t.isoDate === grSingleDate)
      : archivedTemperatures.filter((t) => t.isoDate >= grStartDate && t.isoDate <= grEndDate);

    const visibleSensors = groups
      .filter((g) => groupVisibility[g.id])
      .flatMap((g) => g.sensors);

    return filtered.filter((t) => visibleSensors.includes(t.sensor_name));
  }, [archivedTemperatures, grIsSingleDate, grStartDate, grEndDate, grSingleDate, groups, groupVisibility]);

  // ✅ Températures à télécharger
  const tempsToDownload = useMemo(() => {
    if (!archivedTemperatures.length) return [];
    return dlIsSingleDate
      ? archivedTemperatures.filter((t) => t.isoDate === dlSingleDate)
      : archivedTemperatures.filter((t) => t.isoDate >= dlStartDate && t.isoDate <= dlEndDate);
  }, [archivedTemperatures, dlIsSingleDate, dlSingleDate, dlStartDate, dlEndDate]);

  // ✅ Liste des capteurs
  const sensorsList = useMemo(
    () => Array.from(new Set(archivedTemperatures.map((t) => t.sensor_name))).sort(),
    [archivedTemperatures]
  );

  return (
    <div className="temperature-container">
      {notification && (
        <div className={`notification ${notification.type}`}>
          <FaBell className="notification-icon" />
          <span className="notification-message">{notification.message}</span>
        </div>
      )}

      <h1 className="section-title">Dashboard de votre installation</h1>

      <div className="cards-container">
        <Sidebar />

        <DownloadCard
          isSingleDate={dlIsSingleDate} setIsSingleDate={setDlIsSingleDate}
          selectedStartDate={dlStartDate} setSelectedStartDate={setDlStartDate}
          selectedEndDate={dlEndDate} setSelectedEndDate={setDlEndDate}
          selectedSingleDate={dlSingleDate} setSelectedSingleDate={setDlSingleDate}
          archivedTemperatures={archivedTemperatures} tempsToDisplay={tempsToDownload}
        />

        <GroupCard
          groups={groups} setGroups={setGroups} sensorsList={sensorsList} setNotification={setNotification}
        />

        <ProgramCard
          schedule={schedule} setSchedule={setSchedule}
          setShowProgramModal={setShowProgramModal} setEditingProgram={setEditingProgram}
          setShowAllProgramsModal={setShowAllProgramsModal}
          progression={progression} setProgression={setProgression}
          setNotification={setNotification}
        />
      </div>

      {showProgramModal && (
        <ProgramModal
          editingProgram={editingProgram} setEditingProgram={setEditingProgram}
          setShowProgramModal={setShowProgramModal}
          setSchedule={setSchedule} setFilteredSchedule={setSchedule}
          setNotification={setNotification} schedule={schedule}
        />
      )}

      {showAllProgramsModal && (
        <AllProgramsModal
          filteredSchedule={schedule} setShowAllProgramsModal={setShowAllProgramsModal}
          setEditingProgram={setEditingProgram} setShowProgramModal={setShowProgramModal}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          setNotification={setNotification} setSchedule={setSchedule}
        />
      )}

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

      {lastUpdate && (
        <div className="last-update">
          Dernière mise à jour :{" "}
          {formatDate(lastUpdate, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      )}
    </div>
  );
};

export default TemperatureCards;
