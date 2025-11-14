import { getnearbyLocations, getRecommendLocations , getPlaceDetails} from "../controllers/locations.controller.js";
import express from "express";
const router = express.Router();

router.get("/", getnearbyLocations);
router.post("/recommendations", getRecommendLocations);
router.get("/:id", getPlaceDetails);


export default router;