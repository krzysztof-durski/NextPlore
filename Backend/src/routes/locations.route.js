import { getnearbyLocations, getRecommendLocations , getPlaceDetails} from "../controllers/locations.controller.js";
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
const router = express.Router();

router.use(authenticate);

router.get("/", getnearbyLocations);
router.post("/recommendations", getRecommendLocations);
router.get("/:id", getPlaceDetails);


export default router;