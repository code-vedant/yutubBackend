import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cloudinary, uploadBufferToCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

  const pipeline = [];

  
  if (query) {
    const cleanQuery = query.split("-").join(" ")
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: cleanQuery, $options: "i" } },
          { description: { $regex: cleanQuery, $options: "i" } }
        ]
      },
    });
  }
  
  const sortField = sortBy || "createdAt";
  const sortOrder = sortType === "desc" ? -1 : 1;
  
  pipeline.push({
    $sort: { [sortField]: sortOrder },
  });
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerData"
    }
  })

  pipeline.push({ $unwind: { path: "$ownerData", preserveNullAndEmptyArrays: true } });

  pipeline.push({
    $project: {
      title: 1,
      description: 1,
      createdAt: 1,
      duration: 1,
      thumbnail: 1,
      videoFile: 1,
      views: 1,
      isPublished: 1,
      owner: 1,
      "ownerData.fullName": 1,
      "ownerData.avatar": 1
    }
  });
  
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const video = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

  if (!video) {
    return res.status(404).json(new apiResponse(404, null, "Video not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "All video based on query"));
});

const getUserVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json(new apiResponse(400, null, "Invalid User ID"));
  }

  let userObjectId;
  try {
    userObjectId = new mongoose.Types.ObjectId(userId);
  } catch {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Invalid User ID format"));
  }

  const videos = await Video.aggregate([
    { $match: { owner: userObjectId } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerData",
      },
    },
    { $unwind: { path: "$ownerData", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        ownerData: {
          _id: "$ownerData._id",
          fullName: "$ownerData.fullName",
          avatar: "$ownerData.avatar",
        },
      },
    },
  ]);

  if (!videos || videos.length === 0) {
    return res.status(404).json(new apiResponse(404, null, "No videos found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, videos, "User videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const thumbnailBuffer = req.files?.thumbnail?.[0]?.buffer;
  const videoBuffer = req.files?.videoFile?.[0]?.buffer;

  if (!title) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Please provide a title"));
  }
  if (!description) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Please provide a description"));
  }
  if (!thumbnailBuffer) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Thumbnail is required"));
  }
  if (!videoBuffer) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Video is required"));
  }

  const thumbnail = await cloudinary(thumbnailBuffer, `thumbnail_${title}`);
  const video = await cloudinary(videoBuffer, `video_${title}`);

  if (!thumbnail?.url) {
    return res
      .status(500)
      .json(new apiResponse(500, null, "Error while uploading thumbnail"));
  }
  if (!video?.url) {
    return res
      .status(500)
      .json(new apiResponse(500, null, "Error while uploading video"));
  }

  const newVideo = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: video.url,
    duration: video.duration,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new apiResponse(200, newVideo, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json(new apiResponse(400, null, "Invalid Video ID"));
  }

  let videoObjectId;
  try {
    videoObjectId = new mongoose.Types.ObjectId(videoId);
  } catch {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Invalid Video ID format"));
  }

  let userObjectId = null;
  if (req.user && req.user._id) {
    userObjectId = new mongoose.Types.ObjectId(req.user._id);
  }

  await Video.updateOne({ _id: videoObjectId }, { $inc: { views: 1 } });

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
    return res.status(404).json(new apiResponse(404, null, "Video not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, video[0], "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json(new apiResponse(400, null, "Invalid video ID"));
  }

  const { title, description } = req.body;
  const thumbnailBuffer = req.file?.buffer;

  if (!title) {
    return res
      .status(401)
      .json(new apiResponse(401, null, "Please provide a title"));
  }
  if (!description) {
    return res
      .status(401)
      .json(new apiResponse(401, null, "Please provide a description"));
  }
  if (!thumbnailBuffer) {
    return res
      .status(401)
      .json(
        new apiResponse(401, null, "Updating error: Thumbnail is required")
      );
  }

  const thumbnail = await uploadBufferToCloudinary(thumbnailBuffer, `thumbnail_${videoId}`);

  if (!thumbnail?.url) {
    return res
      .status(500)
      .json(new apiResponse(500, null, "Error while uploading thumbnail"));
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { title, description, thumbnail: thumbnail.url },
    { new: true }
  );

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json(new apiResponse(400, null, "Invalid video id"));
  }

  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    return res.status(404).json(new apiResponse(404, null, "Video not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json(new apiResponse(400, null, "Invalid video id"));
  }

  const video = await Video.findById(videoId);
  if (!video) {
    return res.status(404).json(new apiResponse(404, null, "Video not found"));
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new apiResponse(200, video, "Video status updated successfully"));
});

export {
  getAllVideos,
  getUserVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
