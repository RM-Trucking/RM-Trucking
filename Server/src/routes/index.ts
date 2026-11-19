import { Router } from 'express';
import authorizationRouter from './authorization';
import maintenanceRouter from './maintenance';
import shipmentRouter from './shipment';

const router = Router();

// Mount module routers
router.use('/authorization', authorizationRouter);
router.use('/maintenance', maintenanceRouter);
router.use('/network-shipment', shipmentRouter);



export default router;
