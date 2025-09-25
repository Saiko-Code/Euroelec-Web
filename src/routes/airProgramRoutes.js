const express = require("express");
const router = express.Router();
const db = require("../configs/db");
const { getDaysBetween, getNextDay } = require("../utils/utils");

// Helper → exécution de requêtes SQL avec promesse
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// Fonction pour insérer un programme
async function insertProgram(day, startTime, endTime, action, name = "", isActive = 0) {
  const sql =
    "INSERT INTO `air-system-program` (day, start_time, end_time, action, name, is_active) VALUES (?, ?, ?, ?, ?, ?)";
  const result = await query(sql, [day, startTime, endTime, action, name, isActive]);
  return result.insertId;
}

// ✅ GET - récupérer tous les programmes
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT * FROM \`air-system-program\`
      ORDER BY FIELD(day, 'lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'), start_time
    `;
    const results = await query(sql);

    const grouped = [];
    const usedIds = new Set();

    for (let i = 0; i < results.length; i++) {
      const curr = results[i];
      if (usedIds.has(curr.id)) continue;

      if (curr.end_time === "23:59:59") {
        const group = [curr];
        let last = curr;

        for (let j = i + 1; j < results.length; j++) {
          const next = results[j];
          if (
            getNextDay(last.day) === next.day &&
            next.start_time === "00:00:00" &&
            next.action === last.action &&
            next.name === last.name
          ) {
            group.push(next);
            usedIds.add(next.id);
            last = next;
            if (next.end_time !== "23:59:59") break;
          } else {
            break;
          }
        }

        if (group.length > 1) {
          grouped.push({
            id: group.map((p) => p.id).join("-"),
            startDay: group[0].day,
            endDay: group[group.length - 1].day,
            startTime: group[0].start_time,
            endTime: group[group.length - 1].end_time,
            action: group[0].action,
            name: group[0].name,
            isMultiDay: true,
            days: group.map((p) => p.day),
            is_active: group.some((p) => p.is_active === 1) ? 1 : 0,
          });
          group.forEach((p) => usedIds.add(p.id));
        } else {
          grouped.push({ ...curr, isMultiDay: false });
        }
      } else {
        grouped.push({ ...curr, isMultiDay: false });
      }
    }

    res.json({
      status: "success",
      data: {
        singleDay: grouped.filter((p) => !p.isMultiDay),
        multiDay: grouped.filter((p) => p.isMultiDay),
      },
    });
  } catch (err) {
    console.error("❌ Erreur SELECT `air-system-program` :", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

// ✅ POST - ajouter un programme
router.post("/", async (req, res) => {
  try {
    const { day, start, end, action, name, isMultiDay, days } = req.body;
    if (!day || !start || !end || !action || !name) {
      return res.status(400).json({ status: "error", message: "Champs manquants." });
    }

    if (isMultiDay && days && days.length > 1) {
      const allDays = getDaysBetween(days[0], days[days.length - 1]);
      const insertedIds = [];

      insertedIds.push(await insertProgram(allDays[0], start, "23:59:59", action, name, 0));
      for (let i = 1; i < allDays.length - 1; i++) {
        insertedIds.push(await insertProgram(allDays[i], "00:00:00", "23:59:59", action, name, 0));
      }
      if (allDays.length > 1) {
        insertedIds.push(await insertProgram(allDays.at(-1), "00:00:00", end, action, name, 0));
      }

      return res.status(201).json({
        status: "success",
        message: "Programmations multi-jours ajoutées.",
        insertedIds,
        days: allDays,
      });
    } else {
      const id = await insertProgram(day, start, end, action, name, 0);
      return res.status(201).json({
        status: "success",
        message: "Programmation ajoutée.",
        insertedId: id,
      });
    }
  } catch (err) {
    console.error("❌ Erreur lors de l'insertion :", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

// ✅ POST - répéter un programme existant sur d'autres jours
router.post("/:id/repeat", async (req, res) => {
  const programId = req.params.id;
  const { days } = req.body;

  if (!days || !Array.isArray(days) || days.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "Liste des jours manquante ou invalide.",
    });
  }

  try {
    const [original] = await query("SELECT * FROM `air-system-program` WHERE id = ?", [programId]);

    if (!original) {
      return res.status(404).json({
        status: "error",
        message: "Programme original introuvable.",
      });
    }

    const insertedIds = [];
    for (const day of days) {
      const newId = await insertProgram(
        day,
        original.start_time,
        original.end_time,
        original.action,
        original.name,
        original.is_active
      );
      insertedIds.push(newId);
    }

    res.status(201).json({
      status: "success",
      message: "Programme répété sur les jours sélectionnés.",
      insertedIds,
      days,
    });
  } catch (err) {
    console.error("❌ Erreur lors de la répétition :", err);
    res.status(500).json({ status: "error", message: "Erreur serveur.", details: err.sqlMessage });
  }
});

// ✅ PUT - activer/désactiver un programme
router.put("/activate/:id", async (req, res) => {
  const { is_active } = req.body;
  const programId = req.params.id;

  try {
    await query("UPDATE `air-system-program` SET is_active = ? WHERE id = ?", [is_active, programId]);
    res.json({ status: "success", message: `Programme ${is_active ? "activé" : "désactivé"}.` });
  } catch (err) {
    console.error("❌ Erreur lors de l'activation :", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

// ✅ PUT - modifier un programme (mono ou multi-jours)
router.put("/:id", async (req, res) => {
  const rawId = req.params.id;
  const { day, start, end, action, name, isMultiDay, days } = req.body;

  try {
    if (rawId.includes("-")) {
      const ids = rawId.split("-").map((x) => parseInt(x, 10));
      await query(`DELETE FROM \`air-system-program\` WHERE id IN (${ids.map(() => "?").join(",")})`, ids);

      if (isMultiDay && days && days.length > 1) {
        const allDays = getDaysBetween(days[0], days.at(-1));
        for (let i = 0; i < allDays.length; i++) {
          if (i === 0) await insertProgram(allDays[i], start, "23:59:59", action, name, 0);
          else if (i === allDays.length - 1) await insertProgram(allDays[i], "00:00:00", end, action, name, 0);
          else await insertProgram(allDays[i], "00:00:00", "23:59:59", action, name, 0);
        }
      }
      res.json({ status: "success", message: "Programme multi-jours modifié." });
    } else {
      await query(
        "UPDATE `air-system-program` SET day = ?, start_time = ?, end_time = ?, action = ?, name = ? WHERE id = ?",
        [day, start, end, action, name, rawId]
      );
      res.json({ status: "success", message: "Programme modifié." });
    }
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour :", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

// ✅ DELETE - supprimer un programme (mono ou multi-jours)
router.delete("/:id", async (req, res) => {
  const rawId = req.params.id;
  const ids = rawId.includes("-") ? rawId.split("-").map(Number) : [parseInt(rawId, 10)];

  try {
    const result = await query(
      `DELETE FROM \`air-system-program\` WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: "error", message: "Programme introuvable." });
    }

    res.json({ status: "success", message: "Programme supprimé." });
  } catch (err) {
    console.error("❌ Erreur lors de la suppression :", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

module.exports = router;
