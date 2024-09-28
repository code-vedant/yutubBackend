import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedTweets,
    getLikedComments,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").patch(toggleVideoLike);
router.route("/toggle/c/:commentId").patch(toggleCommentLike);
router.route("/toggle/t/:tweetId").patch(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
router.route("/tweets").get(getLikedTweets);
router.route("/comments").get(getLikedComments);

export default router