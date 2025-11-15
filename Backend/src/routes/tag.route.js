import express from "express";
import { getAllTags } from "../controllers/tag.controller.js";

const router = express.Router();

// Get all tags (public endpoint - no auth required for filter page)
router.get("/", getAllTags);

export default router;

