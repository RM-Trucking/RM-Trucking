import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth";
import * as carrierController from "../../controllers/maintenance/carrier";
import { db } from '../../config/db2';

const router = Router();

// CREATE
router.post("/", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.createCarrier(req, res, conn);
    conn.close();
});

// UPDATE
router.put("/:id", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.updateCarrier(req, res, conn);
    conn.close();
});

// GET ALL
router.get("/", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.listCarriers(req, res, conn);
    conn.close();
});

// GET BY ID
router.get("/:id", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.getCarrierById(req, res, conn);
    conn.close();
});

// DROPDOWN
router.get("/dropdown", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.listCarrierDropdown(req, res, conn);
    conn.close();
});

// TOGGLE STATUS
router.patch("/:id/status", authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.toggleCarrierStatus(req, res, conn);
    conn.close();
});

router.get('/by-rate/:rateId', authenticateJWT, async (req, res) => {
    const conn = await db();
    await carrierController.getCarriersByRateId(req, res, conn);
    conn.close();
});


export default router;
