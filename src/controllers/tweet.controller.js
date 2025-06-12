import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json(new apiResponse(400, null, "Content is required & cannot be empty"));
  }

  const tweet = await Tweet.create({ content, owner: req.user._id });

  if (!tweet) {
    return res.status(500).json(new apiResponse(500, null, "Tweet creation failed"));
  }

  return res
    .status(201)
    .json(new apiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid user ID"));
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json(new apiResponse(404, null, "User not found"));
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
  ]);

  if (!tweets) {
    return res.status(500).json(new apiResponse(500, null, "Error while fetching tweets"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweets, "All tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json(new apiResponse(400, null, "Content cannot be empty"));
  }

  if (!isValidObjectId(tweetId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid tweet ID"));
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    return res.status(404).json(new apiResponse(404, null, "Tweet not found"));
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    return res.status(401).json(new apiResponse(401, null, "User is unauthorized to update this tweet"));
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content },
    },
    { new: true }
  );

  if (!updatedTweet) {
    return res.status(500).json(new apiResponse(500, null, "Error while updating tweet"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid tweet ID"));
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    return res.status(404).json(new apiResponse(404, null, "Tweet not found"));
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    return res.status(401).json(new apiResponse(401, null, "User is unauthorized to delete this tweet"));
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    return res.status(500).json(new apiResponse(500, null, "Error while deleting tweet"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
