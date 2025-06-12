import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(channelId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid channel id"));
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    return res.status(404).json(new apiResponse(404, null, "Channel not found"));
  }

  const existedSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existedSubscription) {
    await existedSubscription.deleteOne();
    return res
      .status(200)
      .json(new apiResponse(200, {}, "Unsubscribed successfully"));
  } else {
    const subscription = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });
    return res
      .status(200)
      .json(new apiResponse(200, subscription, "Subscribed successfully"));
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid channel id"));
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    return res.status(404).json(new apiResponse(404, null, "Channel not found"));
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
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
    {
      $project: {
        subscriber: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, subscribers, "Subscribers retrieved successfully"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    return res.status(400).json(new apiResponse(400, null, "Invalid subscriber id"));
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
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
    {
      $project: {
        channel: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new apiResponse(200, channels, "Channels retrieved successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };