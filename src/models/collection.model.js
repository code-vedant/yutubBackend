import mongoose, { Schema } from "mongoose";

const collectionSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description:  {
        type: String,
        required: true,
    },
    photos: [{
            type: Schema.Types.ObjectId,
            ref: "Photo",
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
},{timestamps:true})

export const Collection = mongoose.model("Playlist", collectionSchema);