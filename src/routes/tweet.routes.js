import { Router } from 'express';
import {
    getAllTweets,
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import { upload } from "../middlewares/multer.middlerware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.route("/").get(getAllTweets); 
router.use(verifyJWT);
router.route("/").post(upload.array("images",5),createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router