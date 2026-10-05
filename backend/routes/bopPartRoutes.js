import express from "express";
import {
    getAllBopPartConfigurations,
    getBopPartConfiguration,
    saveBopPartConfiguration,
    updateBopPartConfiguration,
    deleteBopPartConfiguration,
} from "../controllers/bopPartController.js";

const router = express.Router();

/* GET ALL PART-BOP CONFIGURATIONS*/
router.get("/", getAllBopPartConfigurations,);

/* GET BOP CONFIGURATION FOR ONE PART */
router.get("/:partNo", getBopPartConfiguration,);

/* CREATE / SAVE PART-BOP CONFIGURATION */
router.post("/", saveBopPartConfiguration,);

/* UPDATE PART-BOP CONFIGURATION */
router.put("/:partNo", updateBopPartConfiguration,);

/* DELETE PART-BOP CONFIGURATION */
router.delete("/:partNo", deleteBopPartConfiguration,);

export default router;