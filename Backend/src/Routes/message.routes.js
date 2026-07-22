import express from "express";
import {
  getMessages,
  sendMessages,
  getUsersForSidebar,
  deleteMessage,
} from "../Controllers/message.controller.js";
import { auth } from "../Middlewares/auth.middleware.js";
import { validateParams } from "../Middlewares/validate.middleware.js";
import { idParamSchema } from "../Schemas/validation.schemas.js";

const router = express.Router();

router.get("/users", auth, getUsersForSidebar);
router.get("/:id", auth, validateParams(idParamSchema), getMessages);
router.post("/send/:id", auth, validateParams(idParamSchema), sendMessages);
router.delete("/delete/:id", auth, validateParams(idParamSchema), deleteMessage);

export default router;