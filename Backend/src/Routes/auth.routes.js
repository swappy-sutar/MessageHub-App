import express from "express";
import {
  signupUser,
  loginUser,
  googleAuth,
  updateProfile,
  checkAuth,
  logout,
} from "../Controllers/auth.controller.js";
import { auth } from "../Middlewares/auth.middleware.js";
import { validateBody } from "../Middlewares/validate.middleware.js";
import { signupSchema, loginSchema } from "../Schemas/validation.schemas.js";

const router = express.Router();

router.post("/signup", validateBody(signupSchema), signupUser);
router.post("/login", validateBody(loginSchema), loginUser);
router.post("/google", googleAuth);
router.put("/update-profile", auth, updateProfile);
router.post("/logout", logout);

router.get("/check-auth", auth, checkAuth);

export default router;