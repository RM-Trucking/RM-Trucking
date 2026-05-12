import { Router } from "express";
import { authenticateJWT } from "../../middleware/auth";
import * as printerController from "../../controllers/maintenance/printers";
import { db } from '../../config/db2';

const router = Router();

// CREATE
router.post("/", authenticateJWT, async (req, res) => {
    const conn = await db();
    await printerController.createPrinter(req, res, conn);
    conn.close();
});

// UPDATE
router.put("/:id", authenticateJWT, async (req, res) => {
    const conn = await db();
    await printerController.updatePrinter(req, res, conn);
    conn.close();
});

// GET ALL
router.get("/", authenticateJWT, async (req, res) => {
    const conn = await db();
    await printerController.listPrinters(req, res, conn);
    conn.close();
});

// GET BY ID
router.get("/:id", authenticateJWT, async (req, res) => {
    const conn = await db();
    await printerController.getPrinterById(req, res, conn);
    conn.close();
});

// DROPDOWN
router.get("/dropdown/list", authenticateJWT, async (req, res) => {
    const conn = await db();
    await printerController.listPrinterDropdown(req, res, conn);
    conn.close();
});

// TOGGLE STATUS
router.patch("/:id/status", authenticateJWT, async (req, res) => {
    const conn = await db();
    await printerController.togglePrinterStatus(req, res, conn);
    conn.close();
});

export default router;
