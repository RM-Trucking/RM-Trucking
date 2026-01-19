import { Router } from 'express';
import maintenanceRouter from './maintenance';

const router = Router();

// Mount module routers
router.use('/maintenance', maintenanceRouter);


export default router;
