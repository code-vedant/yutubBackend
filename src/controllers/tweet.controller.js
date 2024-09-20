import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new apiError(400, "Content is required & cannot be empty");
  }

  const tweet = await Tweet.create({ content, owner: req.user._id });

  if (!tweet) {
    throw new apiError(500, "Tweet creation failed");
  }

  return res
    .status(201)
    .json(new apiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new apiError(400, "invalid user id");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner:new mongoose.Types.ObjectId(userId),
      },
    },
  ]);

  if (!tweets) {
    throw new apiError(500, "Error while fetching tweets");
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweets, "all tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new apiError(400, "Content cannot be empty");
  }

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new apiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new apiError(401, "User is Unauthorized to update tweet");
  }

  const updateTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updateTweet) {
    throw new apiError(404, "Error while updating tweet");
  }

  return res
    .status(200)
    .json(new apiResponse(200, updateTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "invalid tweet id");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new apiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new apiError(401, "User is Unauthorized to update tweet");
  }

  const deleteTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deleteTweet) {
    throw new apiError(404, "Error while deleting tweet");
  }

  return res
    .status(200)
    .json(new apiResponse(200, deleteTweet, "Tweet deleted successfully"));
});


export { createTweet, getUserTweets, updateTweet, deleteTweet };
