import { Router } from 'express';
import maintenanceRouter from './maintenance';
import shipmentRouter from './shipment';

const router = Router();

// Mount module routers
router.use('/maintenance', maintenanceRouter);
router.use('/network-shipment', shipmentRouter);



export default router;
