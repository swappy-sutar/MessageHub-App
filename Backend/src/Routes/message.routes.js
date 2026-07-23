import express from "express";
import {
  getMessages,
  sendMessages,
  getUsersForSidebar,
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
  pinMessage,
  getPinnedMessages,
  searchMessages,
  syncMessages,
} from "../Controllers/message.controller.js";
import { auth } from "../Middlewares/auth.middleware.js";
import { validateParams, validateBody } from "../Middlewares/validate.middleware.js";
import {
  idParamSchema,
  editMessageSchema,
  reactionSchema,
} from "../Schemas/validation.schemas.js";

const router = express.Router();

router.get("/users", auth, getUsersForSidebar);
router.get("/sync", auth, syncMessages);
router.get("/pinned/:id", auth, validateParams(idParamSchema), getPinnedMessages);
router.get("/search/:id", auth, validateParams(idParamSchema), searchMessages);
router.get("/:id", auth, validateParams(idParamSchema), getMessages);
router.post("/send/:id", auth, validateParams(idParamSchema), sendMessages);
router.put("/edit/:id", auth, validateParams(idParamSchema), validateBody(editMessageSchema), editMessage);
router.post("/reaction/:id", auth, validateParams(idParamSchema), validateBody(reactionSchema), addReaction);
router.delete("/reaction/:id", auth, validateParams(idParamSchema), removeReaction);
router.post("/pin/:id", auth, validateParams(idParamSchema), pinMessage);
router.delete("/delete/:id", auth, validateParams(idParamSchema), deleteMessage);

export default router;