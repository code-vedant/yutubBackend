import { Router } from 'express';
import {
  getVideoComments,
  getTweetComments,
  getPhotoComments,
  addVideoComment,
  addTweetComment,
  addPhotoComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();


router.route("/:videoId").get(getVideoComments).post(verifyJWT,addVideoComment);
router.route("/:tweetId").get(getTweetComments).post(verifyJWT,addTweetComment);
router.route("/:photoId").get(getPhotoComments).post(verifyJWT,addPhotoComment);
router.route("/c/:commentId").delete(verifyJWT,deleteComment).patch(verifyJWT,updateComment);

export default router