import Photo from "../models/photo.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import {  uploadBufferToCloudinary } from "../utils/cloudinary.js"

// Upload a new photo
const uploadPhoto = asyncHandler(async (req, res) => {
  const { photoFile, title, description } = req.body;

  if (!photoFile) {
    return res
      .status(400)
      .json({ success: false, message: "photoField field is required" });
  }

  if (!title) {
    return res
      .status(400)
      .json({ success: false, message: "title field is required" });
  }

  if (!description) {
    return res
      .status(400)
      .json({ success: false, message: "desc field is required" });
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, "photos");

  const photo = await Photo.create({
    photoFile: result.secure_url,
    title,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new apiResponse(201, photo, "Photo uploaded successfully"));
});

// Get a paginated list of published photos
const getPublishedPhotos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", sortBy, sortType } = req.query;

  const cleanedSearch = search.replace(/-/g, " ").trim();

  const pipeline = [];

  // Only add match stage if search is not empty
  if (cleanedSearch) {
    pipeline.push({
      $match: {
        isPublished: true,
        $or: [
          { title: { $regex: cleanedSearch, $options: "i" } },
          { description: { $regex: cleanedSearch, $options: "i" } },
        ],
      },
    });
  } else {
    // If no search, just filter published
    pipeline.push({
      $match: {
        isPublished: true,
      },
    });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: { fullName: 1, username: 1, avatar: 1 },
          },
        ],
      },
    },
    { $unwind: "$owner" }
  );

  const sortField = sortBy || "createdAt";
  const sortOrder = sortType === "desc" ? -1 : 1;

  pipeline.push({
    $sort: { [sortField]: sortOrder },
  });

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const aggregateQuery = Photo.aggregate(pipeline);
  const result = await Photo.aggregatePaginate(aggregateQuery, options);

  return res
    .status(200)
    .json(new apiResponse(200, result, "Photos fetched successfully"));
});


// Get a single photo by ID
const getPhotoById = asyncHandler(async (req, res) => {
  const { photoId } = req.params;

  if (!isValidObjectId(photoId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid photo ID" });
  }

  const photo = await Photo.findById(photoId).populate(
    "owner",
    "fullName username avatar"
  );

  if (!photo) {
    return res.status(404).json({ success: false, message: "Photo not found" });
  }

  return res
    .status(200)
    .json(new apiResponse(200, photo, "Photo retrieved successfully"));
});

// Update photo details
const updatePhoto = asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const { title, description, isPublished } = req.body;

  if (!isValidObjectId(photoId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid photo ID" });
  }

  const photo = await Photo.findOneAndUpdate(
    { _id: photoId, owner: req.user._id },
    { title, description, isPublished },
    { new: true }
  );

  if (!photo) {
    return res
      .status(404)
      .json({
        success: false,
        message: "Photo not found or not owned by user",
      });
  }

  return res
    .status(200)
    .json(new apiResponse(200, photo, "Photo updated successfully"));
});

// Delete a photo
const deletePhoto = asyncHandler(async (req, res) => {
  const { photoId } = req.params;

  if (!isValidObjectId(photoId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid photo ID" });
  }

  const photo = await Photo.findOneAndDelete({
    _id: photoId,
    owner: req.user._id,
  });

  if (!photo) {
    return res
      .status(404)
      .json({
        success: false,
        message: "Photo not found or not owned by user",
      });
  }

  return res
    .status(200)
    .json(new apiResponse(200, photo, "Photo deleted successfully"));
});

// Get photos uploaded by the current user
const getMyPhotos = asyncHandler(async (req, res) => {
  const photos = await Photo.find({ owner: req.user._id });

  return res
    .status(200)
    .json(new apiResponse(200, photos, "Photos fetched successfully"));
});

export {
  uploadPhoto,
  getPublishedPhotos,
  getPhotoById,
  updatePhoto,
  deletePhoto,
  getMyPhotos,
};
