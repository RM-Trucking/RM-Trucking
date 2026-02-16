import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import * as rateController from '../../controllers/maintenance/customerRate';
import { db } from '../../config/db2';


const router = express.Router();

// -------------------- Warehouse Rate --------------------
router.post('/warehouse-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.createWarehouseRate(req, res, conn);
    conn.close();
});

router.get('/warehouse-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getWarehouseRate(req, res, conn);
    conn.close();
});

router.put('/warehouse-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.updateWarehouseRate(req, res, conn);
    conn.close();
});

router.delete('/warehouse-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.deleteWarehouseRate(req, res, conn);
    conn.close();
});

// List warehouse rates with search + pagination
router.get('/warehouse-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listWarehouseRates(req, res, conn);
    conn.close();
});


// -------------------- Transport Rate --------------------
router.post('/transport-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.createTransportRate(req, res, conn);
    conn.close();
});

router.get('/transport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getTransportRate(req, res, conn);
    conn.close();
});

router.put('/transport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.updateTransportRate(req, res, conn);
    conn.close();
});

router.delete('/transport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.deleteTransportRate(req, res, conn);
    conn.close();
});

// List transport rates with search + pagination
router.get('/transport-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listTransportRates(req, res, conn);
    conn.close();
});


router.get('/transport-rate/by-zone', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listTransportRatesByZone(req, res, conn);
    conn.close();
});



// -------------------- Station Rate Map --------------------
router.post('/station-rate-map', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.assignRateToStation(req, res, conn);
    conn.close();
});

router.get('/station-rate-map/', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getStationRates(req, res, conn);
    conn.close();
});

router.delete('/station-rate-map/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.deleteStationRateMap(req, res, conn);
    conn.close();
});

export default router;
