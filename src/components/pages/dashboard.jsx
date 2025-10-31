import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FaBell, FaBars, FaTimes } from "react-icons/fa";
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
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/styles/dashboard.css";

const toISODate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // DownloadCard dates
  const [dlIsSingleDate, setDlIsSingleDate] = useState(false);
  const [dlStartDate, setDlStartDate] = useState("");
  const [dlEndDate, setDlEndDate] = useState("");
  const [dlSingleDate, setDlSingleDate] = useState("");

  // GraphCard dates
  const grIsSingleDate = false;
  const [grStartDate, setGrStartDate] = useState("");
  const [grEndDate, setGrEndDate] = useState("");
  const [grSingleDate, setGrSingleDate] = useState("");

  const firstLoad = useRef(true);
  const { notification, setNotification } = useNotification();

  /* ==========================
     FETCH DATA
  =========================== */
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

      const allSensors = Array.from(new Set(formatted.map((t) => t.sensor_name))).sort();
      setSensorVisibility(allSensors.reduce((acc, s) => ({ ...acc, [s]: true }), {}));

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

  const { fetchData: fetchGroups } = useFetch({
    url: "/sensor-groups",
    onSuccess: (data) => setGroups(data.data),
    onError: (err) => console.error(err),
  });

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

  /* ==========================
     INIT + VISIBILITY
  =========================== */
  useEffect(() => {
    fetchTemperatures();
    fetchGroups();
    fetchPrograms();
  }, [fetchTemperatures, fetchGroups, fetchPrograms]);

  useEffect(() => {
    if (groups.length) {
      setGroupVisibility(groups.reduce((acc, g) => ({ ...acc, [g.id]: true }), {}));
    }
  }, [groups]);

  const toggleGroupVisibility = useCallback(
    (groupId) => setGroupVisibility((prev) => ({ ...prev, [groupId]: !prev[groupId] })),
    []
  );

  const toggleSensorVisibility = useCallback(
    (sensor) => setSensorVisibility((prev) => ({ ...prev, [sensor]: !prev[sensor] })),
    []
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.classList.toggle("menu-open", !isMobileMenuOpen);
  };

  /* ==========================
     FILTERS
  =========================== */
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

  const tempsToDownload = useMemo(() => {
    if (!archivedTemperatures.length) return [];
    return dlIsSingleDate
      ? archivedTemperatures.filter((t) => t.isoDate === dlSingleDate)
      : archivedTemperatures.filter((t) => t.isoDate >= dlStartDate && t.isoDate <= dlEndDate);
  }, [archivedTemperatures, dlIsSingleDate, dlSingleDate, dlStartDate, dlEndDate]);

  const sensorsList = useMemo(
    () => Array.from(new Set(archivedTemperatures.map((t) => t.sensor_name))).sort(),
    [archivedTemperatures]
  );

  /* ==========================
     RENDER
  =========================== */
  return (
    <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
      <div className="main-content">
        <div className="temperature-container container-fluid py-2">
          {/* Notification */}
          {notification && (
            <div className={`alert alert-${notification.type} d-flex align-items-center`} role="alert">
              <FaBell className="me-2" />
              <div>{notification.message}</div>
            </div>
          )}

          <h1 className="section-title mb-3 text-center">Dashboard de votre installation</h1>

          {/* CARTES */}
          <div className="row g-3">
            <div className="col-12 col-md-12 col-xl-6 ">
              <DownloadCard
                isSingleDate={dlIsSingleDate}
                setIsSingleDate={setDlIsSingleDate}
                selectedStartDate={dlStartDate}
                setSelectedStartDate={setDlStartDate}
                selectedEndDate={dlEndDate}
                setSelectedEndDate={setDlEndDate}
                selectedSingleDate={dlSingleDate}
                setSelectedSingleDate={setDlSingleDate}
                archivedTemperatures={archivedTemperatures}
                tempsToDisplay={tempsToDownload}
              />
            </div>

            <div className="col-12 col-md-12 col-xl-6 ">
              <GroupCard
                groups={groups}
                setGroups={setGroups}
                sensorsList={sensorsList}
                setNotification={setNotification}
              />
            </div>

            <div className="col-12 col-md-12 col-xl-12 ">
              <ProgramCard
                schedule={schedule}
                setSchedule={setSchedule}
                setShowProgramModal={setShowProgramModal}
                setEditingProgram={setEditingProgram}
                setShowAllProgramsModal={setShowAllProgramsModal}
                progression={progression}
                setProgression={setProgression}
                setNotification={setNotification}
              />
            </div>
          </div>

          {/* MODALES */}
          {showProgramModal && (
            <ProgramModal
              editingProgram={editingProgram}
              setEditingProgram={setEditingProgram}
              setShowProgramModal={setShowProgramModal}
              setSchedule={setSchedule}
              setFilteredSchedule={setSchedule}
              setNotification={setNotification}
              schedule={schedule}
            />
          )}

          {showAllProgramsModal && (
            <AllProgramsModal
              filteredSchedule={schedule}
              setShowAllProgramsModal={setShowAllProgramsModal}
              setEditingProgram={setEditingProgram}
              setShowProgramModal={setShowProgramModal}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setNotification={setNotification}
              setSchedule={setSchedule}
            />
          )}

          {lastUpdate && (
            <div className="text-center text-muted mt-4">
              Dernière mise à jour :{" "}
              {formatDate(lastUpdate, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

export default TemperatureCards;
