import { useState, useEffect, useRef, useCallback } from "react";
import { formatDate } from "../utils/format";

const PORT = process.env.REACT_APP_SERVER_PORT;
const HOST = process.env.REACT_APP_SERVER_IP;

export default function useTemperatureData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [archivedTemperatures, setArchivedTemperatures] = useState([]);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [selectedSingleDate, setSelectedSingleDate] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [progression, setProgression] = useState(null);
  const [notification, setNotification] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isSingleDate, setIsSingleDate] = useState(false);
  const [repeatDialog, setRepeatDialog] = useState(null);
  const [repeatSelectedDays, setRepeatSelectedDays] = useState([]);

  const lastNotifiedAction = useRef(null);
  const firstLoad = useRef(true);

  // --------------------------
  // FETCH TEMPERATURES
  // --------------------------
  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    fetch(`http://${HOST}:${PORT}/temperature`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const formattedData = data.data.map((item) => ({
          ...item,
          formattedDate: formatDate(item.timestamp, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
        }));

        setArchivedTemperatures(formattedData);

        if (firstLoad.current) {
          const today = formatDate(new Date(), {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          setSelectedStartDate(today);
          setSelectedEndDate(today);
          setSelectedSingleDate(today);
          firstLoad.current = false;
        }

        setLastUpdate(new Date());
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des températures :", err);
        setError(err);
        setLoading(false);
      });
  }, []);

  // --------------------------
  // FETCH PROGRAMMES
  // --------------------------
  const fetchPrograms = useCallback(() => {
    fetch(`http://${HOST}:${PORT}/air-program`)
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const allPrograms = [
          ...(data.singleDay || []).map((entry) => ({
            id: entry.id,
            day: entry.day,
            start: entry.start_time,
            end: entry.end_time,
            action: entry.action,
            isMultiDay: false,
          })),
          ...(data.multiDay || []).map((entry) => ({
            id: `${entry.id}-group`,
            startDay: entry.startDay,
            endDay: entry.endDay,
            start: entry.startTime,
            end: entry.endTime,
            action: entry.action,
            isMultiDay: true,
            days: [entry.startDay, entry.endDay],
          })),
        ];
        setSchedule(allPrograms);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des programmations :", err);
      });
  }, []);

  // --------------------------
  // SUPPRESSION PROGRAMME
  // --------------------------
  const deleteProgram = useCallback(
    async (programId) => {
      const isConfirmed = window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette programmation ?"
      );
      if (!isConfirmed) return;
      try {
        const response = await fetch(
          `http://${HOST}:${PORT}/air-program/${programId}`,
          { method: "DELETE" }
        );
        if (!response.ok)
          throw new Error("Erreur lors de la suppression de la programmation.");

        const programIdStr = String(programId);
        setSchedule((prevSchedule) => {
          if (programIdStr.includes("-")) {
            const [startId, endId] = programIdStr.split("-");
            return prevSchedule.filter(
              (item) =>
                String(item.id) !== startId && String(item.id) !== endId
            );
          } else {
            return prevSchedule.filter(
              (item) => String(item.id) !== programIdStr
            );
          }
        });

        setNotification({
          type: "success",
          message: "Programmation supprimée avec succès.",
        });
      } catch (err) {
        console.error("Erreur lors de la suppression :", err);
        setNotification({
          type: "error",
          message: err.message || "Erreur lors de la suppression.",
        });
      } finally {
        setTimeout(() => setNotification(null), 3000);
        fetchData();
      }
    },
    [fetchData]
  );

  // --------------------------
  // MISE À JOUR PROGRESSION
  // --------------------------
  useEffect(() => {
    const updateClockAndProgress = () => {
      const now = new Date();
      const daysOfWeek = [
        "dimanche",
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
      ];
      const todayIndex = now.getDay();
      const todayName = daysOfWeek[todayIndex];
      const yesterdayName = daysOfWeek[(todayIndex + 6) % 7];

      let progressFound = null;

      schedule.forEach((item) => {
        if (item.isMultiDay || !item.day) return;

        const [startH, startM] = item.start.split(":").map(Number);
        const [endH, endM] = item.end.split(":").map(Number);
        const itemDay = item.day.toLowerCase();

        let startDate = new Date(now);
        let endDate = new Date(now);

        if (itemDay === todayName) {
          startDate.setHours(startH, startM, 0);
          endDate.setHours(endH, endM, 0);
          if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
        } else if (
          itemDay === yesterdayName &&
          (endH < startH || (endH === startH && endM < startM))
        ) {
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(startH, startM, 0);
          endDate.setHours(endH, endM, 0);
        } else {
          return;
        }

        if (now >= startDate && now < endDate) {
          const totalDuration = endDate - startDate;
          const elapsed = now - startDate;
          const percent = Math.min(
            100,
            Math.max(0, (elapsed / totalDuration) * 100)
          );
          progressFound = { action: item.action, percent };

          const currentActionId = `${item.day}-${item.start}-${item.end}-${item.action}`;
          if (
            item.action === "ventilation" &&
            lastNotifiedAction.current !== currentActionId
          ) {
            setNotification({ type: "info", message: "La ventilation est en cours." });
            lastNotifiedAction.current = currentActionId;
            setTimeout(() => setNotification(null), 3000);
          }
        }
      });

      setProgression(progressFound);
    };

    const interval = setInterval(updateClockAndProgress, 1000);
    return () => clearInterval(interval);
  }, [schedule]);

  // --------------------------
  // CHARGEMENT INITIAL + RAFRAÎCHISSEMENT (optionnel)
  // --------------------------
  useEffect(() => {
    fetchData();
    fetchPrograms();

    // Si tu veux un polling auto :
   // const id = setInterval(fetchData, 3600000); // 60 s
    // return () => clearInterval(id);
  }, [fetchData, fetchPrograms]);

  // --------------------------
  // FILTRAGE DES TEMPÉRATURES
  // --------------------------
  const tempsToDisplay = isSingleDate
    ? archivedTemperatures.filter(
        (item) => item.formattedDate === selectedSingleDate
      )
    : archivedTemperatures.filter(
        (item) =>
          item.formattedDate >= selectedStartDate &&
          item.formattedDate <= selectedEndDate
      );

  return {
    loading,
    error,
    notification,
    lastUpdate,
    tempsToDisplay,
    archivedTemperatures,
    isSingleDate,
    setIsSingleDate,
    selectedStartDate,
    selectedEndDate,
    selectedSingleDate,
    setSelectedStartDate,
    setSelectedSingleDate,
    setSelectedEndDate,
    schedule,
    progression,
    repeatDialog,
    setRepeatDialog,
    repeatSelectedDays,
    setRepeatSelectedDays,
    deleteProgram,
    fetchData,
    fetchPrograms,
  };
}
