import express from "express";
import db from "../config/db.js";
const router = express.Router();

const plantController = require("../controllers/plantController");

router.get("/", plantController.getAllPlants);

module.exports = router;