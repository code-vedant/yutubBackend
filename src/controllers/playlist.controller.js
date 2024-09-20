import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === "" || !description || description.trim() == "") {
    throw new apiError(400, "Name and description is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new apiError(500, "Playlist creation failed");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "playlist created successfully"));

  //TODO: create playlist
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new apiError(400, "invalid user id");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner:new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "Video",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, playlists, " playist fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "invalid Playlist id");
  }

  const playlist = await Playlist.findById(playlistId);
  
  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }

  return res.status(200).json(new apiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
    throw new apiError(400, "Invalid playlist or video id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos:new mongoose.Types.ObjectId(videoId) } },
    { new: true }
  );

  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }

  return res.status(200).json(new apiResponse(200, playlist, "Video added to playlist successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid playlist or video id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }

  return res.status(200).json(new apiResponse(200, playlist, "Video removed from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid playlist id");
  }

  if (
    !name ||
    name.trim() === "" ||
    !description ||
    description.trim() === ""
  ) {
    throw new apiError(400, "Name and description are required");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { name, description },
    { new: true }
  );

  if (!playlist) {
    throw new apiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
