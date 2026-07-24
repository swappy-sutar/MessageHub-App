import express from "express";
import {
  signupUser,
  loginUser,
  googleAuth,
  updateProfile,
  checkAuth,
  refreshTokenController,
  logout,
  logoutAll,
  getActiveSessions,
  getAccountReport,
  deleteUserAccount,
} from "../Controllers/auth.controller.js";
import { auth } from "../Middlewares/auth.middleware.js";
import { validateBody } from "../Middlewares/validate.middleware.js";
import { signupSchema, loginSchema } from "../Schemas/validation.schemas.js";

const router = express.Router();

router.post("/signup", validateBody(signupSchema), signupUser);
router.post("/login", validateBody(loginSchema), loginUser);
router.post("/google", googleAuth);
router.post("/refresh-token", refreshTokenController);
router.put("/update-profile", auth, updateProfile);
router.post("/logout", auth, logout);
router.post("/logout-all", auth, logoutAll);

router.get("/check-auth", auth, checkAuth);
router.get("/sessions", auth, getActiveSessions);
router.get("/account-report", auth, getAccountReport);
router.delete("/delete-account", auth, deleteUserAccount);

export default router;