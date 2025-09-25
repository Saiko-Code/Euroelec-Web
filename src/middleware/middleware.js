const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");

module.exports = (app) => {
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.use(bodyParser.json());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};
