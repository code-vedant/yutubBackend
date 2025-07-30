import { Router } from 'express';
import {
    getAllTweets,
    getTweetById,
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import { upload } from "../middlewares/multer.middlerware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.route("/").get(getAllTweets); 
router.route("/:tweetId").get(getTweetById); 
router.route("/user/:userId").get(getUserTweets);
router.use(verifyJWT);
router.route("/").post(upload.array("images",5),createTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router