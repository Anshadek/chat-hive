import { MessageRequestService } from "./messageRequest.service.js";
import { success, error } from "../../utils/apiResponse.js";

export const MessageRequestController = {
    send: async (req, res) => {
        try {
            const sender = req.user.id;
            const { receiver } = req.body;

            const request = await MessageRequestService.sendRequest(sender, receiver);

            return success(res, "Request sent successfully", request);
        } catch (err) {
            return error(res, err.message, 400);
        }
    },
    

    accept: async (req, res) => {
        try {
            const { id } = req.params;

            const updated = await MessageRequestService.acceptRequest(id);

            return success(res, "Request accepted", updated);
        } catch (err) {
            return error(res, err.message, 400);
        }
    },

    reject: async (req, res) => {
        try {
            const { id } = req.params;

            const updated = await MessageRequestService.rejectRequest(id);

            return success(res, "Request rejected", updated);
        } catch (err) {
            return error(res, err.message, 400);
        }
    },

    pendingList: async (req, res) => {
        try {
            const id = req.user.id;
            const list = await MessageRequestService.getPendingList(id);

            return success(res, "Request pending list", list);
        } catch (err) {
            return error(res, err.message, 400);
        }
    },
    rejectedList: async (req, res) => {
        try {
            const id = req.user.id;

            const list = await MessageRequestService.getRejectedList(id);

            return success(res, "Request rejected list", list);
        } catch (err) {
            return error(res, err.message, 400);
        }
    },
    acceptedList: async (req, res) => {
        try {
            const id = req.user.id;

            const list = await MessageRequestService.getAcceptedList(id);

            return success(res, "Request accepted list", list);
        } catch (err) {
            return error(res, err.message, 400);
        }
    },
    
};
