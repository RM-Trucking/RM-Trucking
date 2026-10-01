import express from 'express';
import { authenticateJWT } from '../../middleware/auth';
import * as rateController from '../../controllers/maintenance/carrierRate';
import { db } from '../../config/db2';


const router = express.Router();

// -------------------- Transport Rate --------------------
router.post('/transport-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.createCarrierTransportRate(req, res, conn);
    conn.close();
});

router.get('/transport-rate/quote', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getCarrierTransportRateQuote(req, res, conn);
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

// -------------------- Airport Rate --------------------
router.post('/airport-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.createCarrierAirportRate(req, res, conn);
    conn.close();
});

router.get('/airport-rate/quote', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getCarrierAirportRateQuote(req, res, conn);
    conn.close();
});

router.get('/airport-rate/by-zone', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listCarrierAirportRatesByZone(req, res, conn);
    conn.close();
});

router.get('/airport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.getCarrierAirportRate(req, res, conn);
    conn.close();
});

router.put('/airport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.updateCarrierAirportRate(req, res, conn);
    conn.close();
});

router.delete('/airport-rate/:id', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.deleteCarrierAirportRate(req, res, conn);
    conn.close();
});

router.get('/airport-rate', authenticateJWT, async (req, res) => {
    const conn = await db();
    await rateController.listCarrierAirportRates(req, res, conn);
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
