import express from "express";
import multer from "multer";
import { analyzeResume, getHistory } from "../controllers/analysisController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/analyze",
  protect,
  upload.single("resume"),
  analyzeResume
);
router.get("/history", protect, getHistory);

export default router;
