
export const prepareChartData = (tempsToDisplay, isSingleDate) => {
  const parseTimestamp = (ts) => (typeof ts === 'string' ? new Date(ts) : new Date(ts));
  const formatHour = (date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const formatDay = (date) => date.toISOString().slice(0, 10);
  const formatValue = (val) => +(val / 10).toFixed(1);

  if (isSingleDate) {
    const groupedByHour = tempsToDisplay.reduce((acc, temp) => {
      const date = parseTimestamp(temp.timestamp);
      const hour = formatHour(date);
      const key = temp.sensor_name === 'sonde_1' ? 'exterior' : temp.sensor_name;
      if (!acc[hour]) acc[hour] = { heure: hour };
      acc[hour][key] = formatValue(temp.value);
      return acc;
    }, {});
    return Object.values(groupedByHour).sort((a, b) => {
      const [ha, ma] = a.heure.split(':').map(Number);
      const [hb, mb] = b.heure.split(':').map(Number);
      return (ha * 60 + ma) - (hb * 60 + mb);
    });
  } else {
    const grouped = {};
    tempsToDisplay.forEach(temp => {
      const date = parseTimestamp(temp.timestamp);
      const day = formatDay(date);
      const hour = formatHour(date);
      const time = `${day} ${hour}`;
      const key = temp.sensor_name === 'sonde_1' ? 'exterior' : temp.sensor_name;
      const value = formatValue(temp.value);
      if (!grouped[time]) grouped[time] = { time };
      grouped[time][key] = value;
    });
    return Object.values(grouped).sort((a, b) => new Date(a.time) - new Date(b.time));
  }
};
