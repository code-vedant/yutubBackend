import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!comments) {
    throw new apiError(404, "Comments not found");
  }

  return res.json(
    new apiResponse(200, comments, "Comments retrieved successfully")
  );
});

const getTweetComments = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid tweet id");
  }
  const comments = await Comment.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!comments) {
    throw new apiError(404, "Comments not found");
  }
  return res.json(
    new apiResponse(200, comments, "Comments retrieved successfully")
  );
});

const getPhotoComments = asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  if (!isValidObjectId(photoId)) {
    throw new apiError(400, "Invalid photo id");
  }
  const comments = await Comment.aggregate([
    {
      $match: {
        photo: new mongoose.Types.ObjectId(photoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!comments) {
    throw new apiError(404, "Comments not found");
  }
  return res.json(
    new apiResponse(200, comments, "Comments retrieved successfully")
  );
});

const addVideoComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { videoId } = req.params;

  if (!content || content.trim() === "") {
    throw new apiError(400, "Comment cannot be empty or invalid content");
  }

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const videoComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  if (!videoComment) {
    throw new apiError(500, "Comment creation failed");
  }

  return res.json(
    new apiResponse(201, videoComment, "Comment created successfully")
  );
});

const addTweetComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content || content.trim() === "") {
    throw new apiError(400, "Comment cannot be empty or invalid content");
  }

  if (!isValidObjectId(tweetId)) {
    throw new apiError(400, "Invalid video id");
  }

  const tweetComment = await Comment.create({
    content,
    tweet: tweetId,
    owner: req.user._id,
  });

  if (!tweetComment) {
    throw new apiError(500, "Comment creation failed");
  }

  return res.json(
    new apiResponse(201, tweetComment, "Comment created successfully")
  );
});

const addPhotoComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { photoId } = req.params;

  const images = req.files?.images?.map((file) => file.path);

  if (!content || content.trim() === "") {
    throw new apiError(400, "Comment cannot be empty or invalid content");
  }

  if (!isValidObjectId(photoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const photoComment = await Comment.create({
    content,
    photo: photoId,
    owner: req.user._id,
  });

  if (!photoComment) {
    throw new apiError(500, "Comment creation failed");
  }

  return res.json(
    new apiResponse(201, photoComment, "Comment created successfully")
  );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new apiError(400, "Comment cannot be empty or invalid content");
  }

  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid comment id");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true }
  );

  if (!updatedComment) {
    throw new apiError(404, "Error while updating comment");
  }

  return res.json(
    new apiResponse(200, updatedComment, "Comment updated successfully")
  );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new apiError(400, "Invalid comment id");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new apiError(404, "Error while deleting comment");
  }

  return res.json(
    new apiResponse(200, deletedComment, "Comment deleted successfully")
  );
});

export {
  getVideoComments,
  getTweetComments,
  getPhotoComments,
  addVideoComment,
  addTweetComment,
  addPhotoComment,
  updateComment,
  deleteComment,
};
