import { Request, Response, Router } from "express";
import * as airlineController from "../../controllers/maintenance/airline";
import { authenticateJWT } from "../../middleware/auth";
import { db } from "../../config/db2";

const router = Router();

// GET /maintenance/airline/dropdown?airportCode=XXX&searchTerm=YYY
router.get("/dropdown", authenticateJWT, async (req: Request, res: Response) => {
    const conn = await db();
    await airlineController.getAirlineDropdown(req, res, conn);
});

export default router;