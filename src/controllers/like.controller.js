import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const like = await Like.findOne({ video: videoId, likedBy: user });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new apiResponse(200, null, "Unliked the Video"));
  } else {
    const newLike = await Like.create({ video: videoId, likedBy: user });
    return res
      .status(200)
      .json(new apiResponse(200, newLike, "Liked the Video"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const user = req.user._id;

  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid comment id");
  }

  const like = await Like.findOne({ comment: commentId, likedBy: user });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new apiResponse(200, null, "Unliked the comment"));
  } else {
    const newLike = await Like.create({ comment: commentId, likedBy: user });
    return res
      .status(200)
      .json(new apiResponse(200, newLike, "Liked the comment"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet id");
  }

  const like = await Like.findOne({ tweet: tweetId, likedBy: user });

  if (like) {
    await like.deleteOne();
    return res
      .status(200)
      .json(new apiResponse(200, null, "Unliked the tweet"));
  } else {
    const newLike = await Like.create({ tweet: tweetId, likedBy: user });
    return res
      .status(200)
      .json(new apiResponse(200, newLike, "Liked the tweet"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: { $ne: null },
  }).populate("video");

  if (!likedVideos) {
    throw new apiError(400, "Error getting liked videos");
  }

  return res
    .status(200)
    .json(new apiResponse(200, likedVideos, "Success getting liked videos"));
});

const getLikedTweets = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const likedTweets = await Like.find({
    likedBy: userId,
    tweet: { $ne: null },
  }).populate("tweet");

  if (!likedTweets) {
    throw new apiError(400, "No liked tweets found");
  }

  return res
  .status(200)
  .json(new apiResponse(200,likedTweets,"Liked tweets fetched successfully"
    )
  );
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getLikedTweets,
};
