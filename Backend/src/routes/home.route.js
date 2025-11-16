import { getnearbyLocations} from "../controllers/locations.controller.js";
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
const router = express.Router();



router.use(authenticate);

router.get("/", getnearbyLocations);


export default router;