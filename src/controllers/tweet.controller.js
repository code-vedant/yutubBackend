import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllTweets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", sortBy, sortType } = req.query;

  const cleanedSearch = search.replace(/-/g, " ").trim();

  const pipeline = [];

  if (cleanedSearch) {
    pipeline.push({
      $match: {
        content: { $regex: cleanedSearch, $options: "i" },
      },
    });
  }

  const sortField = sortBy || "createdAt";
  const sortOrder = sortType === "desc" ? -1 : 1;

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $sort: { [sortField]: sortOrder }, 
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    }
  );

  pipeline.push({
    $project: {
      content: 1,
      createdAt: 1,
      owner: 1,
      "ownerDetails._id": 1,
      "ownerDetails.fullName": 1,
      "ownerDetails.username": 1,
      "ownerDetails.avatar": 1,
    },
  })

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const tweets = await Tweet.aggregatePaginate(Tweet.aggregate(pipeline),options);

  if (!tweets) {
    return res.status(500).json(new apiResponse(500, null, "Error while fetching tweets"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, tweets, "All tweets fetched successfully"));
})

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === "") {
    return res.status(400).json(new apiResponse(400, null, "Content is required & cannot be empty"));
  }

  let imageUrls = [];

  if (req.files && req.files.length > 0) {
    try {
      const uploadPromises = req.files.map((file) => 
        uploadBufferToCloudinary(file.buffer, "tweets")
      );
      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults.map(result => result.secure_url);
    } catch (error) {
      return res.status(500).json(new apiResponse(500, null, "Image upload failed"));
    }
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
    images: imageUrls, // assuming Tweet schema has images: [String]
  });

  if (!tweet) {
    return res.status(500).json(new apiResponse(500, null, "Tweet creation failed"));
  }

  return res
    .status(201)
    .json(new apiResponse(201, tweet, "Tweet created successfully"));
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


export { getAllTweets,createTweet, getUserTweets, updateTweet, deleteTweet };
