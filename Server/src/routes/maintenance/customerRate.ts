import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import * as rateController from '../../controllers/maintenance/customerRate';
import { db } from '../../config/db2';


const router = express.Router();

// -------------------- Warehouse Rate --------------------
router.post('/warehouse-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.createCustomerWarehouseRate(req, res, conn);
    conn.close();
});

router.get('/warehouse-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getCustomerWarehouseRate(req, res, conn);
    conn.close();
});

router.put('/warehouse-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.updateCustomerWarehouseRate(req, res, conn);
    conn.close();
});

router.delete('/warehouse-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.deleteCustomerWarehouseRate(req, res, conn);
    conn.close();
});

// List warehouse rates with search + pagination
router.get('/warehouse-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listCustomerWarehouseRates(req, res, conn);
    conn.close();
});


// -------------------- Transport Rate --------------------
router.post('/transport-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.createCustomerTransportRate(req, res, conn);
    conn.close();
});

router.get('/transport-rate/quote', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getCustomerTransportRateQuote(req, res, conn);
    conn.close();
});

router.get('/transport-rate/by-zone', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listCustomerTransportRatesByZone(req, res, conn);
    conn.close();
});

router.get('/transport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getCustomerTransportRate(req, res, conn);
    conn.close();
});

router.put('/transport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.updateCustomerTransportRate(req, res, conn);
    conn.close();
});

router.delete('/transport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.deleteCustomerTransportRate(req, res, conn);
    conn.close();
});

// List transport rates with search + pagination
router.get('/transport-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listCustomerTransportRates(req, res, conn);
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
