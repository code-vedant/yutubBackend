import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId)) {
    throw new apiError(400, "Invalid channel id");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new apiError(404, "Channel not found");
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

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log(channelId);
  
  if (!isValidObjectId(channelId)) {
    throw new apiError(400, "Invalid channel id");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new apiError(404, "Channel not found");
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


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new apiError(400, "Invalid subscriber id");
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(`${subscriberId}`),
      },
    },
    {
      $lookup: {
        from: "User",
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
        }
    }
  ]);

  return res
   .status(200)
   .json(new apiResponse(200, channels, "Channels retrieved successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
