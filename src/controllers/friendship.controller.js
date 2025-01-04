import { Friendship } from "../models/friend.model.js";


const sendFriendRequest = async (req, res) => {
    const requesterId = req.user._id.toString();
    const { recipientId } = req.params;
    if(requesterId === recipientId){  
        return res.status(400).json({ message: "You cannot send friend request to yourself." });
    }
    const existingRequest = await Friendship.findOne({ requester: requesterId, recipient: recipientId });
    
    if (existingRequest) {
        return res.status(400).json({ message: "Friend request already sent." });
    }
    
    const newRequest = new Friendship({ requester: requesterId, recipient: recipientId });
    await newRequest.save();
    
    res.status(200).json({ message: "Friend request sent." });
};

const acceptFriendRequest = async (req, res) => {
    const recipientId = req.user._id.toString();
    const { requesterId } = req.params;
    
    const friendship = await Friendship.findOneAndUpdate(
        { requester: requesterId, recipient: recipientId },
        { status: 'accepted' },
        { new: true }
    );
    
    if (!friendship) {
        return res.status(400).json({ message: "Friend request not found." });
    }
    
    res.status(200).json({ message: "Friend request accepted." });
};

const rejectFriendRequest = async (req, res) => {
    const userId = req.user._id.toString();
    const { friendId } = req.params;
        const friendship = await Friendship.findOneAndDelete({$or: [
            { requester: userId, recipient: friendId },
            { requester: friendId, recipient: userId }
        ]} );

    
    if (!friendship) {
        return res.status(400).json({ message: "Friend request not found." });
    }
    
    res.status(200).json({ message: "Friend request rejected." });
};

const getUserFriends = async (req, res) => {
    const userId = req.params.userId;
    
    const friends = await getFriends(userId);
    res.status(200).json(friends);
};

const getUserPendingRequests = async (req, res) => {
    const userId = req.params.userId;
    
    const pendingRequests = await getPendingRequests(userId);
    res.status(200).json(pendingRequests);
};

const getFriends = async (userId) => {
    return await Friendship.find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted'
    }).populate('requester recipient');
};

const getPendingRequests = async (userId) => {
    return await Friendship.find({
        recipient: userId,
        status: 'pending'
    }).populate('requester');
};

export { sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getUserFriends, getUserPendingRequests };