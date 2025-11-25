import mongoose from "mongoose";

const messageRequestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

messageRequestSchema.index(
    { sender: 1, receiver: 1, status: 1 },
    { unique: true }
);

export default mongoose.model("MessageRequest", messageRequestSchema);
