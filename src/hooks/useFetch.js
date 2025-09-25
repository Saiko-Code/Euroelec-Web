import { useState, useCallback, useEffect, useRef } from "react";

const useFetch = ({ url, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const lastFetchRef = useRef(0);

  const fetchData = useCallback(
    async (customUrl = null) => {
      const now = Date.now();
      if (now - lastFetchRef.current < 3600000) return; // 1h = 3600000ms

      setLoading(true);
      try {
        const response = await fetch(
          `http://${process.env.REACT_APP_SERVER_IP}:${process.env.REACT_APP_SERVER_PORT}${customUrl || url}`
        );
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        const data = await response.json();
        onSuccess(data);
        lastFetchRef.current = Date.now();
      } catch (err) {
        onError(err);
      } finally {
        setLoading(false);
      }
    },
    [url, onSuccess, onError]
  );

  useEffect(() => {
    const scheduleNextFetch = () => {
      const now = new Date();
      // Heure actuelle à Paris
      const parisTime = new Date(
        now.toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
      );
      // ms jusqu'à la prochaine heure pile
      const msToNextHour =
        (60 - parisTime.getMinutes()) * 60 * 1000 -
        parisTime.getSeconds() * 1000 -
        parisTime.getMilliseconds();

      const timeout = setTimeout(() => {
        fetchData();
        // Après le premier fetch, interval toutes les heures pile
        const interval = setInterval(fetchData, 3600000);
        window.hourlyFetchInterval = interval;
      }, msToNextHour);

      return () => {
        clearTimeout(timeout);
        if (window.hourlyFetchInterval) clearInterval(window.hourlyFetchInterval);
      };
    };

    // fetch initial + planification
    fetchData();
    const cleanup = scheduleNextFetch();
    return cleanup;
  }, [fetchData]);

  return { fetchData, loading };
};

export default useFetch;
