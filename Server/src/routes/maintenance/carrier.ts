import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth";
import * as carrierController from "../../controllers/maintenance/carrier";
import { db } from '../../config/db2';

const router = Router();

// CREATE
router.post("/carrier", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.createCarrier(req, res, conn);
    conn.close();
});

// UPDATE
router.put("/carrier/:id", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.updateCarrier(req, res, conn);
    conn.close();
});

// GET ALL
router.get("/carrier", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.listCarriers(req, res, conn);
    conn.close();
});

// GET BY ID
router.get("/carrier/:id", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.getCarrierById(req, res, conn);
    conn.close();
});

// DROPDOWN
router.get("/carrier/dropdown", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.listCarrierDropdown(req, res, conn);
    conn.close();
});

// TOGGLE STATUS
router.patch("/carrier/:id/status", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.toggleCarrierStatus(req, res, conn);
    conn.close();
});

export default router;
