import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true,
    },
    likes: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: 0,
    },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment",
    }],
    images: {
        type: [String],
        default: [],
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
},{timestamps: true});

tweetSchema.plugin(mongooseAggregatePaginate)

export const Tweet = mongoose.model("Tweet", tweetSchema);