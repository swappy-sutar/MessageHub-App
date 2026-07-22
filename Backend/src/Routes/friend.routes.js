import express from "express";
import { auth } from "../Middlewares/auth.middleware.js";
import {
  searchUsers,
  inviteByCode,
  sendInvite,
  acceptInvite,
  rejectInvite,
  getInvites,
} from "../Controllers/friend.controller.js";
import { validateBody } from "../Middlewares/validate.middleware.js";
import {
  searchFriendSchema,
  inviteByCodeSchema,
  sendInviteSchema,
  acceptRejectInviteSchema,
} from "../Schemas/validation.schemas.js";

const router = express.Router();

router.use(auth);

router.post("/search", validateBody(searchFriendSchema), searchUsers);
router.post("/invite-code", validateBody(inviteByCodeSchema), inviteByCode);
router.post("/invite", validateBody(sendInviteSchema), sendInvite);
router.post("/accept", validateBody(acceptRejectInviteSchema), acceptInvite);
router.post("/reject", validateBody(acceptRejectInviteSchema), rejectInvite);
router.get("/invites", getInvites);

export default router;
