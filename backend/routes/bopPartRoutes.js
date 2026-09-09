import express from "express";

import {
    getAllBopPartConfigurations,
    getBopPartConfiguration,
    saveBopPartConfiguration,
    updateBopPartConfiguration,
    deleteBopPartConfiguration,
} from "../controllers/bopPartController.js";

const router = express.Router();

/*
============================================================
GET ALL PART-BOP CONFIGURATIONS
============================================================

GET /api/part-bops
============================================================
*/
router.get(
    "/",
    getAllBopPartConfigurations,
);


/*
============================================================
GET BOP CONFIGURATION FOR ONE PART
============================================================

GET /api/part-bops/:partNo
============================================================
*/
router.get(
    "/:partNo",
    getBopPartConfiguration,
);


/*
============================================================
CREATE / SAVE PART-BOP CONFIGURATION
============================================================

POST /api/part-bops
============================================================
*/
router.post(
    "/",
    saveBopPartConfiguration,
);


/*
============================================================
UPDATE PART-BOP CONFIGURATION
============================================================

PUT /api/part-bops/:partNo
============================================================
*/
router.put(
    "/:partNo",
    updateBopPartConfiguration,
);


/*
============================================================
DELETE PART-BOP CONFIGURATION
============================================================

DELETE /api/part-bops/:partNo
============================================================
*/
router.delete(
    "/:partNo",
    deleteBopPartConfiguration,
);


export default router;