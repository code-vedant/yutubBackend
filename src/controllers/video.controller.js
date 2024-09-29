import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { promises as fs } from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const queryObject = {}
  const sortObject = {}

  if(query){
    queryObject.title = { $regex: query, $options: "i" };
  }

  if(sortBy){
    sortObject[sortBy] = sortType === "desc"? -1 : 1;
  }else{
    sortObject.createdAt = -1;
  }

  const options ={
    page : parseInt(page,10),
    limit : parseInt(limit , 10),
    sort : sortObject
  }

  const video = await Video.aggregatePaginate(Video.aggregate(queryObject, options))

  if(!video){
    throw new apiError(404, "Video not found");
  }

  return res.status(200).json(new apiResponse(200,video, "All video based on query"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  const videoLocalPath = req.files?.videoFile[0].path;

  if (!title) {
    throw new apiError("Please provide a title");
  }
  if (!description) {
    throw new apiError("Please provide a description");
  }

  if (!thumbnailLocalPath) {
    throw new apiError("Thumbnail is required");
  }
  if (!videoLocalPath) {
    throw new apiError("Video is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const video = await uploadOnCloudinary(videoLocalPath);

  if (!thumbnail?.url) {
    throw new apiError("Error while uploading thumbnail");
  }
  if (!video?.url) {
    throw new apiError("Error while uploading video");
  }

  const newVideo = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: video.url,
    duration: video.duration,
    owner: req.user._id,
  });

  await fs.unlink(thumbnailLocalPath);
  await fs.unlink(videoLocalPath);

  return res
    .status(200)
    .json(new apiResponse(200, newVideo, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new apiError(400, "Invalid Video ID");
  }

  let videoObjectId;
  try {
    videoObjectId = new mongoose.Types.ObjectId(videoId);
  } catch (error) {
    throw new apiError(400, "Invalid Video ID format");
  }

  let userObjectId = null;
  if (req.user && req.user._id) {
    userObjectId = new mongoose.Types.ObjectId(req.user._id);
  }

  await Video.updateOne(
    { _id: videoObjectId },
    { $inc: { views: 1 } }
  );

  const video = await Video.aggregate([
    { $match: { _id: videoObjectId } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $project: {
        _id: 1,
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        owner: {
          _id: { $ifNull: ["$owner._id", null] },
          username: { $ifNull: ["$owner.username", "Unknown"] },
          fullName: { $ifNull: ["$owner.fullName", "Unknown"] },
          avatar: { $ifNull: ["$owner.avatar", ""] },
        },
        createdAt: 1,
        commentsCount: { $size: { $ifNull: ["$comments", []] } },
        likesCount: { $size: { $ifNull: ["$likes", []] } },
        isLiked: {
          $cond: {
            if: { $in: [userObjectId, "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);

  if (!video || video.length === 0) {
    throw new apiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, video[0], "Video fetched successfully"));
});


const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new apiError(400, "Invalid video ID");
  }

  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if (!title) {
    throw new apiError(401, "Please provide a title");
  }
  if (!description) {
    throw new apiError(401, "Please provide a description");
  }
  if (!thumbnailLocalPath) {
    throw new apiError(401, "Updating error: Thumbnail is required");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail?.url) {
    throw new apiError(500, "Error while uploading thumbnail");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: thumbnail.url,
    },
    { new: true }
  );

  await fs.unlink(thumbnailLocalPath);

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apiError(400, "invalid Video id");
  }
  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new apiError(404, "Video not found");
  }

  return res
   .status(200)
   .json(new apiResponse(200, video, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new apiError(400, "invalid Video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }

  video.isPublished =!video.isPublished;
  await video.save();

  return res
   .status(200)
   .json(new apiResponse(200, video, "Video status updated successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
