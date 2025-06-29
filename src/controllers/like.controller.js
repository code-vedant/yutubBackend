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
    return res.json(new apiResponse(200, null, "Unliked the video"));
  } else {
    const newLike = await Like.create({ video: videoId, likedBy: user });
    await newLike.populate("video");
    return res.json(new apiResponse(200, newLike, "Liked the video"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = req.user._id;

  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid comment id");
  }

  const like = await Like.findOne({ comment: commentId, likedBy: user });

  if (like) {
    await like.deleteOne();
    return res.json(new apiResponse(200, null, "Unliked the comment"));
  } else {
    const newLike = await Like.create({ comment: commentId, likedBy: user });
    await newLike.populate("comment");
    return res.json(new apiResponse(200, newLike, "Liked the comment"));
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
    return res.json(new apiResponse(200, null, "Unliked the tweet"));
  } else {
    const newLike = await Like.create({ tweet: tweetId, likedBy: user });
    await newLike.populate("tweet");
    return res.json(new apiResponse(200, newLike, "Liked the tweet"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: { $ne: null },
  }).populate("video likedBy");

  return res.json(new apiResponse(200, likedVideos, "Success getting liked videos"));
});

const getLikedTweets = asyncHandler(async (req, res) => {
  const likedTweets = await Like.find({
    likedBy: req.user._id,
    tweet: { $ne: null },
  }).populate("tweet likedBy");

  return res.json(new apiResponse(200, likedTweets, "Liked tweets fetched successfully"));
});

const getLikedComments = asyncHandler(async (req, res) => {
  const likedComments = await Like.find({
    likedBy: req.user._id,
    comment: { $ne: null },
  }).populate("comment likedBy");

  return res.json(new apiResponse(200, likedComments, "Liked comments fetched successfully"));
});

const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const likes = await Like.aggregate([
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) }
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    {
      $unwind: "$userDetails"
    },
    {
      $group: {
        _id: "$video",
        likedUsers: { $push: "$userDetails" },
        totalLikes: { $sum: 1 }
      }
    }
  ]);

  return res.json(
    new apiResponse(200, likes[0] || { likedUsers: [], totalLikes: 0 }, "Likes fetched successfully")
  );
});

const getTweetLikes = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet id");
  }

  const likes = await Like.aggregate([
    {
      $match: { tweet: new mongoose.Types.ObjectId(tweetId) }
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    {
      $unwind: "$userDetails"
    },
    {
      $project: {
        _id: 0,
        name: "$userDetails.fullName",
        username: "$userDetails.username",
        profilePicture: "$userDetails.avatar"
      }
    }
  ]);

  return res.json(new apiResponse(200, likes, "Tweet likes fetched successfully"));
});

const getCommentLikes = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid comment id");
  }

  const likes = await Like.aggregate([
    {
      $match: { comment: new mongoose.Types.ObjectId(commentId) }
    },
    {
      $lookup: {
        from: "users",
        localField: "likedBy",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    {
      $unwind: "$userDetails"
    },
    {
      $group: {
        _id: "$comment",
        likedUsers: { $push: "$userDetails" },
        totalLikes: { $sum: 1 }
      }
    }
  ]);

  return res.json(new apiResponse(200, likes[0] || { likedUsers: [], totalLikes: 0 }, "Comment likes fetched successfully"));
});

const checkVideoLiked = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const like = await Like.findOne({ video: videoId, likedBy: user });

  return res.json(new apiResponse(200, !!like, "Check liked status successful"));
});

const checkCommentLiked = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const user = req.user._id;

  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid comment id");
  }

  const like = await Like.findOne({ comment: commentId, likedBy: user });

  return res.json(new apiResponse(200, !!like, "Check liked status successful"));
});

const checkTweetLiked = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const user = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet id");
  }

  const like = await Like.findOne({ tweet: tweetId, likedBy: user });

  return res.json(new apiResponse(200, !!like, "Check liked status successful"));
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getLikedTweets,
  getLikedComments,
  getVideoLikes,
  getTweetLikes,
  getCommentLikes,
  checkVideoLiked,
  checkCommentLiked,
  checkTweetLiked
};
