import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === "" || !description || description.trim() == "") {
    return res.status(400).json(new apiResponse(400, null, "Name and description is required"));
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlist) {
    return res.status(500).json(new apiResponse(500, null, "Playlist creation failed"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid user id"));
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
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
    .json(new apiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid playlist id"));
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    return res.status(404).json(new apiResponse(404, null, "Playlist not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid playlist or video id"));
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: new mongoose.Types.ObjectId(videoId) } },
    { new: true }
  );

  if (!playlist) {
    return res.status(404).json(new apiResponse(404, null, "Playlist not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Video added to playlist successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid playlist or video id"));
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!playlist) {
    return res.status(404).json(new apiResponse(404, null, "Playlist not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, playlist, "Video removed from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid playlist id"));
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    return res.status(404).json(new apiResponse(404, null, "Playlist not found"));
  }

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid playlist id"));
  }

  if (
    !name ||
    name.trim() === "" ||
    !description ||
    description.trim() === ""
  ) {
    return res.status(400).json(new apiResponse(400, null, "Name and description are required"));
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    { name, description },
    { new: true }
  );

  if (!playlist) {
    return res.status(404).json(new apiResponse(404, null, "Playlist not found"));
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