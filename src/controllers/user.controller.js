import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import generateAccessToken from "../utils/generateAccessToken.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  const avatar =  req.file;

  // Validate required fields
  if (!fullName || !email || !username || !password || 
      [fullName, email, username, password].some(f => f.trim() === "")) {
    return res.status(400).json({ 
      success: false, 
      message: "All fields are required" 
    });
  }

  // Check if user already exists
  const existedUser = await User.findOne({ 
    $or: [{ email }, { username: username.toLowerCase() }] 
  });

  if (existedUser) {
    return res.status(400).json({ 
      success: false, 
      message: "Email or username already exists" 
    });
  }

  // Handle avatar upload if provided
  let avatarUrl = "";
  if (avatar) {
    try {
      const avatarBuffer = avatar.buffer;
      
      if (!avatarBuffer) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid avatar file" 
        });
      }

      // Upload to cloudinary using your helper function
      const cloudinaryResult = await uploadBufferToCloudinary(avatarBuffer, "avatars");
      avatarUrl = cloudinaryResult.secure_url;
    } catch (error) {
      console.error("Avatar upload error:", error);
      return res.status(400).json({ 
        success: false, 
        message: "Avatar upload failed" 
      });
    }
  }

  // Create user
  const user = await User.create({
    fullName,
    avatar: avatarUrl,
    coverImage: "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // Generate access token
  const accessToken = generateAccessToken(user._id, res);
  
  // Get created user without sensitive fields
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    return res.status(500).json({ 
      success: false, 
      message: "User creation failed" 
    });
  }

  return res.status(201).json(
    new apiResponse(201, { user: createdUser, accessToken }, "User created successfully")
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    return res.status(400).json({ success: false, message: "Email or username is required" });
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    return res.status(404).json({ success: false, message: "Invalid Credentials" });
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: "Invalid Credentials" });
  }

  const accessToken = generateAccessToken(user._id, res);
  const loggedInUser = await User.findById(user._id).select("-password");

  return res.status(200).json(new apiResponse(200, { user: loggedInUser, accessToken }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: undefined } });

  const options = { httpOnly: true, secure: true };

  return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new apiResponse(200, {}, "User logged out successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    return res.status(400).json({ success: false, message: "Invalid Password" });
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new apiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  return res.status(200).json(new apiResponse(200, user, "Current user fetched successfully"));
});

const updateAccountsDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    return res.status(401).json({ success: false, message: "All fields are required" });
  }

  const user = await User.findByIdAndUpdate(req.user._id, { fullName, email }, { new: true }).select("-password");

  return res.status(200).json(new apiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarBuffer = req.file?.buffer;
  if (!avatarBuffer) {
    return res.status(400).json({ success: false, message: "Avatar is required" });
  }

  const avatar = await uploadBufferToCloudinary(avatarBuffer, "avatars");
  if (!avatar?.url) {
    return res.status(400).json({ success: false, message: "Error while uploading avatar" });
  }

  const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatar.url }, { new: true }).select("-password");

  return res.status(200).json(new apiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageBuffer = req.file?.buffer;
  if (!coverImageBuffer) {
    return res.status(400).json({ success: false, message: "Cover image is required" });
  }

  const coverImage = await uploadBufferToCloudinary(coverImageBuffer, `coverImage_${req.user._id}`);
  if (!coverImage?.url) {
    return res.status(400).json({ success: false, message: "Error while uploading cover image" });
  }

  const user = await User.findByIdAndUpdate(req.user._id, { coverImage: coverImage.url }, { new: true }).select("-password");

  return res.status(200).json(new apiResponse(200, user, "Cover image updated successfully"));
});

const getUserchannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    return res.status(400).json({ success: false, message: "Username is missing" });
  }

  const channel = await User.aggregate([
    { $match: { username: username.toLowerCase() } },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $in: [req.user._id, "$subscribers.subscriber"],
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    return res.status(404).json({ success: false, message: "Channel not found" });
  }

  return res.status(200).json(new apiResponse(200, channel[0], "User channel fetched successfully"));
});

const getUserById = asyncHandler(async (req, res) => {
  const { id: userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  const user = await User.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.status(200).json(new apiResponse(200, user, "User fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1 } }],
            },
          },
          { $addFields: { owner: { $first: "$owner" } } },
        ],
      },
    },
  ]);

  return res.status(200).json(new apiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountsDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserchannelProfile,
  getUserById,
  getWatchHistory,
};
