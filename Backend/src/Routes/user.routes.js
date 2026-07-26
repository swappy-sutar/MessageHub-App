import express from 'express';
import {
  getUsersForSidebar,
  toggleBlockUser,
  toggleFavouriteUser,
  toggleMuteUser,
  reportUser,
  getUserPrivacyStatus,
  getNotificationSettings,
  updateNotificationSettings,
} from '../Controllers/user.controller.js';
import { auth } from "../Middlewares/auth.middleware.js";
import { validateParams } from "../Middlewares/validate.middleware.js";
import { targetUserIdParamSchema } from "../Schemas/validation.schemas.js";

const router = express.Router();

router.get("/get-users", auth, getUsersForSidebar);
router.post("/block/:targetUserId", auth, validateParams(targetUserIdParamSchema), toggleBlockUser);
router.post("/favourite/:targetUserId", auth, validateParams(targetUserIdParamSchema), toggleFavouriteUser);
router.post("/mute/:targetUserId", auth, validateParams(targetUserIdParamSchema), toggleMuteUser);
router.post("/report/:targetUserId", auth, validateParams(targetUserIdParamSchema), reportUser);
router.get("/privacy-status/:targetUserId", auth, validateParams(targetUserIdParamSchema), getUserPrivacyStatus);

router.get("/notification-settings", auth, getNotificationSettings);
router.put("/notification-settings", auth, updateNotificationSettings);

export default router;