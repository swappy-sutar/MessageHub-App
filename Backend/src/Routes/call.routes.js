import express from "express";
import { protect } from "../Middlewares/auth.middleware.js";
import { getHistory, getMissedCount } from "../Controllers/call.controller.js";

const router = express.Router();

// All routes require authenticated user
router.use(protect);

router.get("/history", getHistory);
router.get("/missed-count", getMissedCount);

export default router;
