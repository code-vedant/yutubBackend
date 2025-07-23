import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
  getLikedTweets,
  getLikedComments,
  getVideoLikes,
  getTweetLikes,
  getCommentLikes,
  checkVideoLiked,
  checkCommentLiked,
  checkTweetLiked,
  getLikedPhotos,
  togglePhotoLike,
  getPhotoLikes,
  checkPhotoLiked,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/video/:videoId").get(getVideoLikes);
router.route("/tweet/:tweetId").get(getTweetLikes);
router.route("/comment/:commentId").get(getCommentLikes);
router.route("/photo/:photoId").get(getPhotoLikes);
router.use(verifyJWT);
router.route("/toggle/v/:videoId").patch(toggleVideoLike);
router.route("/toggle/c/:commentId").patch(toggleCommentLike);
router.route("/toggle/t/:tweetId").patch(toggleTweetLike);
router.route("/toggle/p/:photoId").patch(togglePhotoLike);
router.route("/check/v/:videoId").get(checkVideoLiked);
router.route("/check/c/:commentId").get(checkCommentLiked);
router.route("/check/t/:tweetId").get(checkTweetLiked);
router.route("/check/p/:photoId").get(checkPhotoLiked);
router.route("/photos").get(getLikedPhotos);
router.route("/videos").get(getLikedVideos);
router.route("/tweets").get(getLikedTweets);
router.route("/comments").get(getLikedComments);

export default router;
