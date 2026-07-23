import express from "express";
import {
  createGroup,
  getGroupDetails,
  addMembers,
  removeMember,
  promoteAdmin,
} from "../Controllers/group.controller.js";
import { auth } from "../Middlewares/auth.middleware.js";
import { validateParams } from "../Middlewares/validate.middleware.js";
import { idParamSchema } from "../Schemas/validation.schemas.js";

const router = express.Router();

router.post("/create", auth, createGroup);
router.get("/:groupId", auth, getGroupDetails);
router.post("/:groupId/members", auth, addMembers);
router.delete("/:groupId/members/:memberId", auth, removeMember);
router.post("/:groupId/promote", auth, promoteAdmin);

export default router;
