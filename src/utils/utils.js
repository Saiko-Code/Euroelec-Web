function getDaysBetween(startDay, endDay) {
  const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  
  if (!startDay || !endDay) return [];

  const startIndex = daysOfWeek.indexOf(startDay.toLowerCase());
  const endIndex = daysOfWeek.indexOf(endDay.toLowerCase());

  if (startIndex === -1 || endIndex === -1) return [];

  // Gestion des plages qui traversent la fin de la semaine
  if (startIndex <= endIndex) {
    return daysOfWeek.slice(startIndex, endIndex + 1);
  } else {
    return [...daysOfWeek.slice(startIndex), ...daysOfWeek.slice(0, endIndex + 1)];
  }
}

function getNextDay(currentDay) {
  if (!currentDay) return null;
  const daysOfWeek = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const index = daysOfWeek.indexOf(currentDay.toLowerCase());
  return index === -1 ? null : daysOfWeek[(index + 1) % daysOfWeek.length];
}

module.exports = { getDaysBetween, getNextDay };
