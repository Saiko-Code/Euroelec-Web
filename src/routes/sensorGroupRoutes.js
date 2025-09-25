const express = require("express");
const router = express.Router();
const pool = require("../configs/db");

// Middleware de validation pour les groupes de capteurs
const validateSensorGroup = (req, res, next) => {
  const { name, sensors } = req.body;
  if (!name || !sensors || !Array.isArray(sensors) || sensors.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "Un nom et au moins un capteur sont requis."
    });
  }
  next();
};

// Route pour la création d'un groupe de capteurs
router.post("/", validateSensorGroup, (req, res) => {
  const { name, sensors } = req.body;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Erreur de connexion à la base de données:", err);
      return res.status(500).json({ status: "error", message: "Erreur de connexion à la base de données." });
    }
    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        console.error("Erreur de début de transaction:", err);
        return res.status(500).json({ status: "error", message: "Erreur transaction." });
      }
      // 1. Insérer le groupe
      connection.query("INSERT INTO `sensor-groups` (name) VALUES (?)", [name], (err, result) => {
        if (err) {
          connection.rollback(() => {
            connection.release();
            console.error("Erreur lors de l'insertion du groupe:", err);
            res.status(500).json({ status: "error", message: "Erreur création groupe." });
          });
          return;
        }
        const groupId = result.insertId;
        // 2. Associer les capteurs
        if (sensors.length > 0) {
          const placeholders = sensors.map(() => "(?, ?)").join(", ");
          const values = sensors.flatMap(s => [groupId, s]);
          connection.query(
            `INSERT INTO \`sensor-group-mapping\` (group_id, sensor_name) VALUES ${placeholders}`,
            values,
            (err2) => {
              if (err2) {
                connection.rollback(() => {
                  connection.release();
                  console.error("Erreur lors de l'insertion des associations:", err2);
                  res.status(500).json({ status: "error", message: "Erreur mapping sensors." });
                });
                return;
              }
              connection.commit(err3 => {
                connection.release();
                if (err3) {
                  connection.rollback(() => {
                    console.error("Erreur lors de la validation de la transaction:", err3);
                    res.status(500).json({ status: "error", message: "Erreur commit." });
                  });
                  return;
                }
                res.status(201).json({
                  status: "success",
                  message: "Groupe créé avec succès.",
                  data: { id: groupId, name, sensors }
                });
              });
            }
          );
        } else {
          connection.commit(err3 => {
            connection.release();
            if (err3) {
              connection.rollback(() => {
                console.error("Erreur lors de la validation de la transaction:", err3);
                res.status(500).json({ status: "error", message: "Erreur commit." });
              });
              return;
            }
            res.status(201).json({
              status: "success",
              message: "Groupe créé avec succès.",
              data: { id: groupId, name, sensors }
            });
          });
        }
      });
    });
  });
});

// Route pour récupérer tous les groupes de capteurs
router.get("/", (req, res) => {
  pool.query(`
    SELECT g.id AS group_id, g.name AS group_name, m.sensor_name
    FROM \`sensor-groups\` g
    LEFT JOIN \`sensor-group-mapping\` m ON g.id = m.group_id
    ORDER BY g.id;
  `, (err, results) => {
    if (err) {
      console.error("Erreur SELECT groupes :", err);
      return res.status(500).json({ status: "error", message: "Erreur serveur." });
    }
    // Regrouper les résultats
    const groupsMap = {};
    results.forEach(row => {
      if (!groupsMap[row.group_id]) {
        groupsMap[row.group_id] = {
          id: row.group_id,
          name: row.group_name,
          sensors: []
        };
      }
      if (row.sensor_name) {
        groupsMap[row.group_id].sensors.push(row.sensor_name);
      }
    });
    res.json({ status: "success", data: Object.values(groupsMap) });
  });
});

// Route pour supprimer un groupe de capteurs
router.delete("/:id", (req, res) => {
  const groupId = req.params.id;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Erreur de connexion à la base de données:", err);
      return res.status(500).json({ status: "error", message: "Erreur de connexion à la base de données." });
    }
    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        console.error("Erreur de début de transaction:", err);
        return res.status(500).json({ status: "error", message: "Erreur transaction." });
      }
      // Supprimer les associations
      connection.query("DELETE FROM `sensor-group-mapping` WHERE group_id = ?", [groupId], (err1) => {
        if (err1) {
          connection.rollback(() => {
            connection.release();
            console.error("Erreur suppression des associations :", err1);
            return res.status(500).json({ status: "error", message: "Erreur serveur." });
          });
          return;
        }
        // Supprimer le groupe
        connection.query("DELETE FROM `sensor-groups` WHERE id = ?", [groupId], (err2, deleteResult) => {
          if (err2) {
            connection.rollback(() => {
              connection.release();
              console.error("Erreur suppression groupe :", err2);
              return res.status(500).json({ status: "error", message: "Erreur serveur." });
            });
            return;
          }
          connection.commit(err3 => {
            connection.release();
            if (err3) {
              connection.rollback(() => {
                console.error("Erreur lors de la validation de la transaction:", err3);
                res.status(500).json({ status: "error", message: "Erreur commit." });
              });
              return;
            }
            if (deleteResult.affectedRows === 0) {
              return res.status(404).json({ status: "error", message: "Groupe introuvable." });
            }
            res.status(200).json({ status: "success", message: "Groupe supprimé avec succès." });
          });
        });
      });
    });
  });
});

// Route pour modifier un groupe de capteurs
router.put("/:id", validateSensorGroup, (req, res) => {
  const { id } = req.params;
  const { name, sensors } = req.body;
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Erreur de connexion à la base de données:", err);
      return res.status(500).json({ status: "error", message: "Erreur de connexion à la base de données." });
    }
    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        console.error("Erreur de début de transaction:", err);
        return res.status(500).json({ status: "error", message: "Erreur transaction." });
      }
      // 1. Vérifier si le groupe existe
      connection.query("SELECT id FROM `sensor-groups` WHERE id = ?", [id], (err, groupExists) => {
        if (err) {
          connection.rollback(() => {
            connection.release();
            console.error("Erreur lors de la vérification du groupe:", err);
            res.status(500).json({ status: "error", message: "Erreur serveur." });
          });
          return;
        }
        if (groupExists.length === 0) {
          connection.rollback(() => {
            connection.release();
            return res.status(404).json({ status: "error", message: "Groupe introuvable." });
          });
          return;
        }
        // 2. Mettre à jour le nom
        connection.query("UPDATE `sensor-groups` SET name = ? WHERE id = ?", [name, id], (err) => {
          if (err) {
            connection.rollback(() => {
              connection.release();
              console.error("Erreur lors de la mise à jour du groupe:", err);
              res.status(500).json({ status: "error", message: "Erreur serveur." });
            });
            return;
          }
          // 3. Supprimer les anciens capteurs du groupe
          connection.query("DELETE FROM `sensor-group-mapping` WHERE group_id = ?", [id], (err) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                console.error("Erreur lors de la suppression des anciens capteurs:", err);
                res.status(500).json({ status: "error", message: "Erreur serveur." });
              });
              return;
            }
            // 4. Ajouter les nouveaux capteurs
            if (sensors.length > 0) {
              const placeholders = sensors.map(() => "(?, ?)").join(", ");
              const values = sensors.flatMap(s => [id, s]);
              connection.query(
                `INSERT INTO \`sensor-group-mapping\` (group_id, sensor_name) VALUES ${placeholders}`,
                values,
                (err2) => {
                  if (err2) {
                    connection.rollback(() => {
                      connection.release();
                      console.error("Erreur lors de l'insertion des nouveaux capteurs:", err2);
                      res.status(500).json({ status: "error", message: "Erreur serveur." });
                    });
                    return;
                  }
                  connection.commit(err3 => {
                    connection.release();
                    if (err3) {
                      connection.rollback(() => {
                        console.error("Erreur lors de la validation de la transaction:", err3);
                        res.status(500).json({ status: "error", message: "Erreur commit." });
                      });
                      return;
                    }
                    res.status(200).json({
                      status: "success",
                      message: "Groupe mis à jour avec succès.",
                      data: { id, name, sensors }
                    });
                  });
                }
              );
            } else {
              connection.commit(err3 => {
                connection.release();
                if (err3) {
                  connection.rollback(() => {
                    console.error("Erreur lors de la validation de la transaction:", err3);
                    res.status(500).json({ status: "error", message: "Erreur commit." });
                  });
                  return;
                }
                res.status(200).json({
                  status: "success",
                  message: "Groupe mis à jour avec succès.",
                  data: { id, name, sensors }
                });
              });
            }
          });
        });
      });
    });
  });
});

module.exports = router;
