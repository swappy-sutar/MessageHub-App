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

const router = express.Router();

router.get("/get-users", auth, getUsersForSidebar);
router.post("/block/:targetUserId", auth, toggleBlockUser);
router.post("/favourite/:targetUserId", auth, toggleFavouriteUser);
router.post("/mute/:targetUserId", auth, toggleMuteUser);
router.post("/report/:targetUserId", auth, reportUser);
router.get("/privacy-status/:targetUserId", auth, getUserPrivacyStatus);

router.get("/notification-settings", auth, getNotificationSettings);
router.put("/notification-settings", auth, updateNotificationSettings);

export default router;