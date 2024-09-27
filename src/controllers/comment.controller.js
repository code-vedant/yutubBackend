import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "invalid Video id");
  }

  const comments = await Comment.aggregate([
    {
      $match: {
        video:new mongoose.Types.ObjectId(videoId),
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
    throw new apiError(404, "comments not found");
  }

    return res
      .status(200)
      .json(new apiResponse(200, comments, "comments retrieved successfully"));

});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body
  const { videoId } = req.params;

  if (!content || content.trim() === "") {
    throw new apiError(400, "Comment cannot be empty or Invalid Content");
  }

  if (!isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video id");
  }

  const videoComment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  })

  if (!videoComment) {
    throw new apiError(500, "Comment creation failed");
  }

  return res
   .status(201)
   .json(new apiResponse(200, videoComment, "comment created successfully"));

});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new apiError(400, "Comment cannot be empty or Invalid Content");
  }

  if(!isValidObjectId(commentId)){
    throw new apiError(400, "Invalid comment id");
  }

  const updatedComment = await Comment.findByIdAndUpdate(commentId , {
    content
  },{
    new: true
  })

  if(!updatedComment){
    throw new apiError(404, "Error while updating comment");
  }

  return res
   .status(200)
   .json(new apiResponse(200, updatedComment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if(!isValidObjectId(commentId)){
    throw new apiError(400, "Invalid comment id");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if(!deletedComment){
    throw new apiError(404, "Error while deleting comment");
  }

  return res
   .status(200)
   .json(new apiResponse(200, deletedComment, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
