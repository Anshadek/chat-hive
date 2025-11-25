import MessageRequest from "./messageRequest.model.js";

export const MessageRequestService = {

    async sendRequest(sender, receiver) {
        try {
            return await MessageRequest.create({
                sender,
                receiver
            });
        } catch (err) {
            if (err.code === 11000) {
                throw new Error("Request already exists");
            }
            throw err;
        }
    },

    async acceptRequest(id) {
        const updated = await MessageRequest.findByIdAndUpdate(
            id,
            { status: "accepted" },
            { new: true }
        );
    
        if (!updated) {
            throw new Error("Invalid request ID");
        }
    
        return updated;
    },

    async rejectRequest(id) {
        const updated = await MessageRequest.findByIdAndUpdate(
            id,
            { status: "rejected" },
            { new: true }
        );
    
        if (!updated) {
            throw new Error("Invalid request ID");
        }
    
        return updated;
    },

    async getPendingList(id) {
        return await MessageRequest.find({ sender: id, status: "pending" }).populate("receiver", "_id name email");
    },

    async getAcceptedList(id) {
        return await MessageRequest.find({ sender: id, status: "accepted" }).populate("receiver", "_id name email");
    },

    async getRejectedList(id) {
        return await MessageRequest.find({ sender: id, status: "rejected" }).populate("receiver", "_id name email");
    },

    async checkStatus(sender, receiver) {
        return await MessageRequest.findOne({ sender, receiver });
    }
};
