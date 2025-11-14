import express from "express";
import { getAllCountries } from "../controllers/country.controller.js";

const router = express.Router();

// Get all countries (public endpoint - no auth required for dropdown)
router.get("/", getAllCountries);

export default router;
