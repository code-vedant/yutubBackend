import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/c/:channelId").get(getUserChannelSubscribers);
router.route("/u/:subscriberId").get(getSubscribedChannels);
router.use(verifyJWT);
router.route("/c/:channelId").post(toggleSubscription);

export default router;
