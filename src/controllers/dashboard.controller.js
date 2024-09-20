import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const stats=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"videos",
                pipeline:[
                    {
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"likedBy",
                            as:"likes"
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $addFields:{
                totalVideoViews:{
                    $sum:"$videos.views"
                },
                totalSubscribers:{
                    $size:"$subscribers"
                },
                totalVideos:{
                    $size:"$videos"
                },
                totalLikes:{
                    $sum:"$videos.likes"
                }
            }
        },
        {
            $project:{
                totalVideoViews:1,
                totalSubscribers:1,
                totalVideos:1,
                totalLikes:1
            }
        }
    ])
    if(!stats)
        {
            throw new apiError(400,"Error founding data")
        }
        return res.status(200).json(new apiResponse(200,stats[0],"fetched data successfully")) 
    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const videos=await Video.find({owner:req.user._id})
    return res.status(200).json(new apiResponse(200,videos,"Videos returned successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }