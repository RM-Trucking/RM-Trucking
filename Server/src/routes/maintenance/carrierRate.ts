import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import * as rateController from '../../controllers/maintenance/carrierRate';
import { db } from '../../config/db2';


const router = express.Router();

// -------------------- Warehouse Rate --------------------
router.post('/warehouse-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.createCarrierWarehouseRate(req, res, conn);
    conn.close();
});

router.get('/warehouse-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getCarrierWarehouseRate(req, res, conn);
    conn.close();
});

router.put('/warehouse-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.updateCarrierWarehouseRate(req, res, conn);
    conn.close();
});

router.delete('/warehouse-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.deleteCarrierWarehouseRate(req, res, conn);
    conn.close();
});

// List warehouse rates with search + pagination
router.get('/warehouse-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listCarrierWarehouseRates(req, res, conn);
    conn.close();
});


// -------------------- Transport Rate --------------------
router.post('/transport-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.createCarrierTransportRate(req, res, conn);
    conn.close();
});

router.get('/transport-rate/by-zone', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listCarrierTransportRatesByZone(req, res, conn);
    conn.close();
});

router.get('/transport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getCarrierTransportRate(req, res, conn);
    conn.close();
});

router.put('/transport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.updateCarrierTransportRate(req, res, conn);
    conn.close();
});

router.delete('/transport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.deleteCarrierTransportRate(req, res, conn);
    conn.close();
});

// List transport rates with search + pagination
router.get('/transport-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listCarrierTransportRates(req, res, conn);
    conn.close();
});



// -------------------- Terminal Rate Map --------------------
router.post('/terminal-rate-map', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.assignRateToTerminal(req, res, conn);
    conn.close();
});

router.get('/terminal-rate-map/', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getTerminalRates(req, res, conn);
    conn.close();
});

router.delete('/terminal-rate-map/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.deleteTerminalRateMap(req, res, conn);
    conn.close();
});

export default router;
