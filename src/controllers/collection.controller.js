import mongoose, { isValidObjectId } from "mongoose";
import { Collection } from "../models/collection.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createCollection = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === "" || !description || description.trim() == "") {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Name and description is required"));
  }

  const collection = await Collection.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!Collection) {
    return res
      .status(500)
      .json(new apiResponse(500, null, "Collection creation failed"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, collection, "Collection created successfully"));
});

const getUserCollections = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid user id"));
  }

  const Collections = await Collection.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "Photo",
        localField: "photos",
        foreignField: "_id",
        as: "photos",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new apiResponse(200, Collections, "Collections fetched successfully")
    );
});

const getCollectionById = asyncHandler(async (req, res) => {
  const { collectionId } = req.params;

  if (!isValidObjectId(collectionId)) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Invalid Collection id"));
  }

  const collection = await Collection.findById(collectionId);

  if (!collection) {
    return res
      .status(404)
      .json(new apiResponse(404, null, "Collection not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, collection, "Collection fetched successfully"));
});

const addPhotoToCollection = asyncHandler(async (req, res) => {
  const { photoId,collectionId  } = req.params;

  console.log("Adding photo to collection:", collectionId, photoId);
  

  if (!isValidObjectId(collectionId) || !isValidObjectId(photoId)) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Invalid Collection or photo id"));
  }

  const collection = await Collection.findByIdAndUpdate(
    collectionId,
    { $push: { photos: new mongoose.Types.ObjectId(photoId) } },
    { new: true }
  );

  if (!collection) {
    return res
      .status(404)
      .json(new apiResponse(404, null, "Collection not found"));
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, collection, "Photo added to Collection successfully")
    );
});

const removePhotoFromCollection = asyncHandler(async (req, res) => {
  const { collectionId, photoId } = req.params;

  if (!isValidObjectId(collectionId) || !isValidObjectId(photoId)) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Invalid Collection or collection id"));
  }

  const collection = await Collection.findByIdAndUpdate(
    collectionId,
    { $pull: { photos: photoId } },
    { new: true }
  );

  if (!collection) {
    return res
      .status(404)
      .json(new apiResponse(404, null, "Collection not found"));
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        collection,
        "Photo removed from Collection successfully"
      )
    );
});

const deleteCollection = asyncHandler(async (req, res) => {
  const { collectionId } = req.params;

  if (!isValidObjectId(collectionId)) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Invalid Collection id"));
  }

  const collection = await Collection.findByIdAndDelete(collectionId);

  if (!collection) {
    return res
      .status(404)
      .json(new apiResponse(404, null, "Collection not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Collection deleted successfully"));
});

const updateCollection = asyncHandler(async (req, res) => {
  const { collectionId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(collectionId)) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Invalid Collection id"));
  }

  if (
    !name ||
    name.trim() === "" ||
    !description ||
    description.trim() === ""
  ) {
    return res
      .status(400)
      .json(new apiResponse(400, null, "Name and description are required"));
  }

  const collection = await Collection.findByIdAndUpdate(
    collectionId,
    { name, description },
    { new: true }
  );

  if (!collection) {
    return res
      .status(404)
      .json(new apiResponse(404, null, "Collection not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, collection, "Collection updated successfully"));
});

export {
  createCollection,
  getUserCollections,
  getCollectionById,
  addPhotoToCollection,
  removePhotoFromCollection,
  deleteCollection,
  updateCollection,
};
