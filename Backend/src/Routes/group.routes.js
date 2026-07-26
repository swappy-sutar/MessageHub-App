import express from "express";
import {
  createGroup,
  getGroupDetails,
  addMembers,
  removeMember,
  promoteAdmin,
  getUserGroups,
} from "../Controllers/group.controller.js";
import { auth } from "../Middlewares/auth.middleware.js";
import { validateParams, validateBody } from "../Middlewares/validate.middleware.js";
import {
  createGroupSchema,
  groupIdParamSchema,
  removeMemberParamSchema,
} from "../Schemas/validation.schemas.js";

const router = express.Router();

router.post("/create", auth, validateBody(createGroupSchema), createGroup);
router.get("/my-groups", auth, getUserGroups);
router.get("/:groupId", auth, validateParams(groupIdParamSchema), getGroupDetails);
router.post("/:groupId/members", auth, validateParams(groupIdParamSchema), addMembers);
router.delete("/:groupId/members/:memberId", auth, validateParams(removeMemberParamSchema), removeMember);
router.post("/:groupId/promote", auth, validateParams(groupIdParamSchema), promoteAdmin);

export default router;
