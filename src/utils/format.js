// Formater une date avec options
export const formatDate = (timestamp, options = {}) => {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    ...options,
  }).format(new Date(timestamp));
};

// Formater l'affichage des jours dans les programmations
export const formatScheduleDay = (item) => {
  const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  if (item.isMultiDay) {
    const startDayName = daysOfWeek.find(d => d.toLowerCase() === item.startDay?.toLowerCase()) || "Jour inconnu";
    const endDayName = daysOfWeek.find(d => d.toLowerCase() === item.endDay?.toLowerCase()) || "Jour inconnu";
    return `${startDayName} ${item.start || "??:??"} → ${endDayName} ${item.end || "??:??"}`;
  } else {
    const startHour = item.start || "??:??";
    const endHour = item.end || "??:??";
    const dayIndex = daysOfWeek.findIndex(d => d.toLowerCase() === item.day?.toLowerCase());
    if (dayIndex === -1) return "Jour invalide";
    const startDay = daysOfWeek[dayIndex];
    if (endHour < startHour) {
      const nextDay = daysOfWeek[(dayIndex + 1) % daysOfWeek.length];
      return `${startDay} ${startHour} → ${endHour} (${nextDay})`;
    }
    return `${startDay} ${startHour} → ${endHour}`;
  }
};
