const express = require("express");
const router = express.Router();
const db = require("../configs/db");
const { /* getDaysBetween, */ getNextDay } = require("../utils/utils"); // ⬅️ on n'utilise plus getDaysBetween ici

// --- Constante d'ordre de la semaine
const WEEK_ORDER = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];

// --- Helpers ---
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function normalizeTime(t, fallback = "00:00:00") {
  if (!t || typeof t !== "string") return fallback;
  // Accepte "HH:mm" ou "HH:mm:ss"
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  return fallback;
}

// Retourne tous les jours consécutifs de startDay -> endDay inclus,
// en tenant compte du wrap (ex: vendredi -> lundi = [ven,sam,dim,lun])
function consecutiveDays(startDay, endDay) {
  const si = WEEK_ORDER.indexOf(startDay);
  const ei = WEEK_ORDER.indexOf(endDay);
  if (si === -1 || ei === -1) return [];
  if (si <= ei) return WEEK_ORDER.slice(si, ei + 1);
  return WEEK_ORDER.slice(si).concat(WEEK_ORDER.slice(0, ei + 1));
}

// Insertion d’un programme
async function insertProgram(day, startTime, endTime, action, name = "", isActive = 0) {
  if (!day) throw new Error("Le champ 'day' est requis.");
  const sql = `
    INSERT INTO \`air-system-program\`
    (day, start_time, end_time, action, name, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [day, startTime, endTime, action, name, isActive]);
  return result.insertId;
}

// ✅ GET — récupérer tous les programmes
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT * FROM \`air-system-program\`
      ORDER BY FIELD(day,'lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'), start_time
    `;
    const results = await query(sql);

    const grouped = [];
    const used = new Set();

    for (let i = 0; i < results.length; i++) {
      const curr = results[i];
      if (used.has(curr.id)) continue;

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
            used.add(next.id);
            last = next;
            if (next.end_time !== "23:59:59") break;
          } else break;
        }

        if (group.length > 1) {
          grouped.push({
            id: group.map(p => p.id).join("-"),
            startDay: group[0].day,
            endDay: group.at(-1).day,
            startTime: group[0].start_time,
            endTime: group.at(-1).end_time,
            action: group[0].action,
            name: group[0].name,
            isMultiDay: true,
            days: group.map(p => p.day),
            is_active: group.some(p => p.is_active === 1) ? 1 : 0,
          });
          group.forEach(p => used.add(p.id));
        } else grouped.push({ ...curr, isMultiDay: false });
      } else grouped.push({ ...curr, isMultiDay: false });
    }

    res.json({
      status: "success",
      data: {
        singleDay: grouped.filter(p => !p.isMultiDay),
        multiDay: grouped.filter(p => p.isMultiDay),
      },
    });
  } catch (err) {
    console.error("❌ Erreur SELECT:", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

// ✅ POST — créer un programme (mono, multi ou répété)
router.post("/", async (req, res) => {
  try {
    let { day, start, end, action, name, isMultiDay, days, isRepeated } = req.body;

    if (!action || !name)
      return res.status(400).json({ status: "error", message: "Champs manquants (action ou nom)." });

    // Normalisation heures
    start = normalizeTime(start, "00:00:00");
    end   = normalizeTime(end,   "23:59:59");

    const insertedIds = [];

    // 3️⃣ — Répétition sur toute la semaine
    if (isRepeated) {
      for (const d of WEEK_ORDER) {
        insertedIds.push(await insertProgram(d, start, end, action, name, 0));
      }
      return res.status(201).json({
        status: "success",
        message: "Programmation répétée sur toute la semaine ajoutée.",
        insertedIds,
      });
    }

    // 2️⃣ — Multi-jours consécutifs (sans getDaysBetween)
    if (isMultiDay && Array.isArray(days) && days.length > 1) {
      // filtre + tri
      const validDays = days.filter(d => WEEK_ORDER.includes(d));
      if (validDays.length < 2)
        return res.status(400).json({ status: "error", message: "Jours invalides dans la sélection." });

      const sorted = [...validDays].sort(
        (a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b)
      );

      const allDays = consecutiveDays(sorted[0], sorted.at(-1));
      if (!allDays.length)
        return res.status(400).json({ status: "error", message: "Plage de jours invalide." });

      // 1er jour
      insertedIds.push(await insertProgram(allDays[0], start, "23:59:59", action, name, 0));
      // Intermédiaires
      for (let i = 1; i < allDays.length - 1; i++) {
        insertedIds.push(await insertProgram(allDays[i], "00:00:00", "23:59:59", action, name, 0));
      }
      // Dernier jour
      insertedIds.push(await insertProgram(allDays.at(-1), "00:00:00", end, action, name, 0));

      return res.status(201).json({
        status: "success",
        message: "Programmation multi-jours ajoutée.",
        insertedIds,
        days: allDays,
      });
    }

    // 1️⃣ — Mono-jour
    if (!day)
      return res.status(400).json({ status: "error", message: "Jour manquant pour programmation simple." });

    const insertedId = await insertProgram(day, start, end, action, name, 0);
    res.status(201).json({
      status: "success",
      message: "Programmation sur un jour ajoutée.",
      insertedId,
    });
  } catch (err) {
    console.error("❌ Erreur POST:", err);
    res.status(500).json({ status: "error", message: err.message || "Erreur serveur." });
  }
});

// ✅ POST — répéter un programme existant sur d'autres jours
router.post("/:id/repeat", async (req, res) => {
  const programId = req.params.id;
  const { days } = req.body;

  if (!Array.isArray(days) || !days.length)
    return res.status(400).json({ status: "error", message: "Liste de jours invalide." });

  try {
    const [original] = await query("SELECT * FROM `air-system-program` WHERE id = ?", [programId]);
    if (!original)
      return res.status(404).json({ status: "error", message: "Programme introuvable." });

    const insertedIds = [];
    for (const d of days) {
      if (!WEEK_ORDER.includes(d)) continue;
      insertedIds.push(
        await insertProgram(
          d,
          normalizeTime(original.start_time, "00:00:00"),
          normalizeTime(original.end_time, "23:59:59"),
          original.action,
          original.name,
          original.is_active
        )
      );
    }

    res.status(201).json({
      status: "success",
      message: "Programme répété sur les jours sélectionnés.",
      insertedIds,
      days,
    });
  } catch (err) {
    console.error("❌ Erreur /repeat:", err);
    res.status(500).json({ status: "error", message: err.message || "Erreur serveur." });
  }
});

// ✅ PUT — activer/désactiver un programme
router.put("/activate/:id", async (req, res) => {
  const { is_active } = req.body;
  const id = req.params.id;

  try {
    await query("UPDATE `air-system-program` SET is_active = ? WHERE id = ?", [is_active, id]);
    res.json({ status: "success", message: `Programme ${is_active ? "activé" : "désactivé"}.` });
  } catch (err) {
    console.error("❌ Erreur activation:", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

// ✅ PUT — modifier un programme (mono ou multi-jours)
router.put("/:id", async (req, res) => {
  const rawId = req.params.id;
  let { day, start, end, action, name, isMultiDay, days } = req.body;

  start = normalizeTime(start, "00:00:00");
  end   = normalizeTime(end,   "23:59:59");

  try {
    if (rawId.includes("-")) {
      // modification d’un groupe : on supprime puis on réinsère
      const ids = rawId.split("-").map(Number);
      await query(
        `DELETE FROM \`air-system-program\` WHERE id IN (${ids.map(() => "?").join(",")})`,
        ids
      );

      if (isMultiDay && Array.isArray(days) && days.length > 1) {
        const validDays = days.filter(d => WEEK_ORDER.includes(d));
        const sorted = [...validDays].sort(
          (a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b)
        );
        const allDays = consecutiveDays(sorted[0], sorted.at(-1));

        if (!allDays.length)
          return res.status(400).json({ status: "error", message: "Plage de jours invalide." });

        for (let i = 0; i < allDays.length; i++) {
          if (i === 0) await insertProgram(allDays[i], start, "23:59:59", action, name, 0);
          else if (i === allDays.length - 1)
            await insertProgram(allDays[i], "00:00:00", end, action, name, 0);
          else
            await insertProgram(allDays[i], "00:00:00", "23:59:59", action, name, 0);
        }
      }

      res.json({ status: "success", message: "Programme multi-jours modifié." });
    } else {
      // mono-jour
      await query(
        "UPDATE `air-system-program` SET day=?, start_time=?, end_time=?, action=?, name=? WHERE id=?",
        [day, start, end, action, name, rawId]
      );
      res.json({ status: "success", message: "Programme modifié." });
    }
  } catch (err) {
    console.error("❌ Erreur PUT:", err);
    res.status(500).json({ status: "error", message: err.message || "Erreur serveur." });
  }
});

// ✅ DELETE — supprimer un programme
router.delete("/:id", async (req, res) => {
  const rawId = req.params.id;
  const ids = rawId.includes("-") ? rawId.split("-").map(Number) : [parseInt(rawId, 10)];

  try {
    const result = await query(
      `DELETE FROM \`air-system-program\` WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ status: "error", message: "Programme introuvable." });

    res.json({ status: "success", message: "Programme supprimé." });
  } catch (err) {
    console.error("❌ Erreur DELETE:", err);
    res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
});

module.exports = router;
