import express from "express";
import { uploadPreKeys, getPreKeyBundle } from "../Controllers/e2ee.controller.js";
import { auth } from "../Middlewares/auth.middleware.js";

const router = express.Router();

router.post("/keys", auth, uploadPreKeys);
router.get("/bundle/:userId", auth, getPreKeyBundle);

export default router;
