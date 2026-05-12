import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth";
import * as cargoAPIController from "../../controllers/maintenance/cargoAPI";
import { db } from '../../config/db2';

const router = Router();

// CREATE
router.post("/", authenticateJWT, async (req, res) => {
    const conn = await db();
    await cargoAPIController.createCargoAPI(req, res, conn);
    conn.close();
});

// UPDATE
router.put("/:id", authenticateJWT, async (req, res) => {
    const conn = await db();
    await cargoAPIController.updateCargoAPI(req, res, conn);
    conn.close();
});

// GET ALL
router.get("/", authenticateJWT, async (req, res) => {
    const conn = await db();
    await cargoAPIController.listCargoAPIs(req, res, conn);
    conn.close();
});

// GET BY ID
router.get("/:id", authenticateJWT, async (req, res) => {
    const conn = await db();
    await cargoAPIController.getCargoAPIById(req, res, conn);
    conn.close();
});

// DROPDOWN
router.get("/dropdown/list", authenticateJWT, async (req, res) => {
    const conn = await db();
    await cargoAPIController.listCargoAPIDropdown(req, res, conn);
    conn.close();
});

// TOGGLE STATUS
router.patch("/:id/status", authenticateJWT, async (req, res) => {
    const conn = await db();
    await cargoAPIController.toggleCargoAPIStatus(req, res, conn);
    conn.close();
});

export default router;
