import express from "express";
import { uploadPreKeys, getPreKeyBundle } from "../Controllers/e2ee.controller.js";
import { auth } from "../Middlewares/auth.middleware.js";
import { validateBody, validateParams } from "../Middlewares/validate.middleware.js";
import { uploadPreKeysSchema, userIdParamSchema } from "../Schemas/validation.schemas.js";

const router = express.Router();

router.post("/keys", auth, validateBody(uploadPreKeysSchema), uploadPreKeys);
router.get("/bundle/:userId", auth, validateParams(userIdParamSchema), getPreKeyBundle);

export default router;
