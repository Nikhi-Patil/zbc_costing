import express from "express";
import db from "../config/db.js";
async function getPlants() {
    const [rows] = await db.query("SELECT * FROM plant_master");
    return rows;
}

module.exports = {
    getPlants
};