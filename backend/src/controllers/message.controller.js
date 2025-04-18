import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const users = await User.find({ _id: { $ne: userId } }).select("-password");
        res.status(200).json(users);
    } catch (error) {
        console.log(`Error in getUsersForSidebar: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


export const getMessages = async (req, res) => {
    try {
        const myId = req.user._id;
        const userToChatId = req.params.id;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: userToChatId },
                { sender: userToChatId, receiver: myId },
            ],
        });

        res.status(200).json(messages);
    } catch (error) {
        console.log(`Error in getMessages controller: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const { _id: senderId } = req.user;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            text,
            image: imageUrl,
        })

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }


        res.status(201).json(newMessage);
    } catch (error) {
        console.log(`Error in sendMessage controller: ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });

    }
}