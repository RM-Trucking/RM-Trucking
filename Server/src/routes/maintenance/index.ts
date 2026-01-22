import { Router } from 'express';
import authRouter from './auth';
import userRouter from './user';
import roleRouter from './role';
import zoneRouter from './zone';
import accessorialRouter from './accessorial';
import permissionsRouter from './permissions';
import customerRouter from './customer';
import stationRouter from './station';
import departmentRouter from './department';
import noteRouter from './note';
import customerPersonnelRouter from './customerPersonnel';
import entityAccessorialMapRouter from './entityAccessorialMap';

const router = Router();

router.use('/auth', authRouter);

router.use('/user', userRouter);

router.use('/roles', roleRouter);

router.use('/zone', zoneRouter);

router.use('/accessorial', accessorialRouter);

router.use('/entity-accessorial', entityAccessorialMapRouter);

router.use('/permissions', permissionsRouter)

router.use('/customer', customerRouter)

router.use('/station', stationRouter);

router.use('/department', departmentRouter);

router.use('/note', noteRouter);

router.use('/customer-personnel', customerPersonnelRouter);


export default router;
