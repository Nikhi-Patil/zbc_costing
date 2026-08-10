import express from "express"
import db from "../config/db.js"
const Plant = require("../models/plantModel");

exports.getAllPlants = async (req, res) => {

    try {

        const plants = await Plant.getPlants();

        res.json(plants);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

};