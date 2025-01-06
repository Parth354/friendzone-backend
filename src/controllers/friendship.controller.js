import { Friendship } from "../models/friend.model.js";
import { User } from "../models/user.model.js";

const getMongoUserId=async(username)=>{
    const user= await User.findOne({username:username})
    return user?._id ;
}

const sendFriendRequest = async (req, res) => {
    const requesterId = req.user._id;
    const { recipientId } = req.params;
    if(!recipientId){
        return res.status(404).json({message:"Server Error! Check request URL"})
    }
   
    const recipientMongoId = await getMongoUserId(recipientId);
    if(requesterId === recipientMongoId){  
        return res.status(400).json({ message: "You cannot send friend request to yourself." });
    }
    const existingRequest = await Friendship.findOne({ requester: requesterId, recipient: recipientMongoId ,status:"pending"});
    
    if (existingRequest) {
        return res.status(400).json({ message: "Friend request already sent." });
    }
    
    const newRequest = await Friendship.create({ requester: requesterId, recipient: recipientMongoId });
    await newRequest.save();
    return res.status(200).json({ message: "Friend request sent." });
};

const acceptFriendRequest = async (req, res) => {
    const recipientId = req.user._id;
    const { requesterId } = req.params;
    if(!requesterId){
        return res.status(404).json({message:"Server Error! Check request URL"})
    }
    const requesterMongoId = await getMongoUserId(requesterId);
    
    const friendship = await Friendship.findOneAndUpdate(
        { requester: requesterMongoId, recipient: recipientId },
        { status: 'accepted' },
        { new: true }
    );
    
    if (!friendship) {
        return res.status(400).json({ message: "Friend request not found." });
    }
    
    res.status(200).json({ message: "Friend request accepted." });
};

const rejectFriendRequest = async (req, res) => {
    const userId = req.user._id;
    const { friendId } = req.params;
    if(!friendId){
        return res.status(404).json({message:"Server Error! Check request URL"})
    }
    const friendMongoId =await getMongoUserId(friendId)
        const friendship = await Friendship.findOneAndDelete({$or: [
            { requester: userId, recipient: friendMongoId ,status:"pending"},
            { requester: friendMongoId, recipient: userId ,status:"pending"}
        ]} );
    
    if (!friendship) {
        return res.status(400).json({ message: "Friend request not found." });
    }
    
    return res.status(200).json({ message: "Friend request rejected." });
};

const getUserFriends = async (req, res) => {
    const userId = req.user._id;
    
    const friends = await getFriends(userId);
    if(!friends){
       return res.status(200).json({message:"No Friends"})
    }
   return res.status(200).json({friends});
};

const getUserPendingRequests = async (req, res) => {
    const userId = req.user._id
    
    const pendingRequests = await getPendingRequests(userId);
    if(!pendingRequests){
        return res.status(200).json({message:"No pending Friend Request"})
    }
    return res.status(200).json({pendingRequests});
};

const getFriends = async (userId) => {
    const friends =await Friendship.find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted'
    }).populate('requester recipient' ,'username');
    return friends.map(request=>({
        username : request.recipient._id === userId ? request.requester.username : request.recipient.username,
        id: request._id
    }))
};

const getPendingRequests = async (userId) => {
    const requests = await Friendship.find({
        recipient: userId,
        status: 'pending'
    }).populate('requester', 'username _id');

    return requests.map(request => ({
        username: request.requester.username,
        _id: request._id
    }));
};

const getFriendSuggestions = async (req, res) => {
    const userId = req.user._id;

    try {
        const friends = await Friendship.find({
            $or: [{ requester: userId }, { recipient: userId }],
            status: 'accepted',
        }).select('requester recipient');

        const friendIds = friends.map(friend => 
            friend.requester.toString() === userId.toString() 
            ? friend.recipient.toString() 
            : friend.requester.toString()
        );

        const mutualFriends = await Friendship.find({
            $or: [{ requester: { $in: friendIds } }, { recipient: { $in: friendIds } }],
            status: 'accepted',
            $and: [
                { requester: { $ne: userId } },
                { recipient: { $ne: userId } },
                { requester: { $nin: friendIds } },
                { recipient: { $nin: friendIds } }
            ]
        }).select('requester recipient');

        const suggestedFriendIds = new Set();
        mutualFriends.forEach(({ requester, recipient }) => {
            if (!friendIds.includes(requester.toString()) && requester.toString() !== userId.toString()) {
                suggestedFriendIds.add(requester.toString());
            }
            if (!friendIds.includes(recipient.toString()) && recipient.toString() !== userId.toString()) {
                suggestedFriendIds.add(recipient.toString());
            }
        });

        const suggestedFriends = await User.find({ _id: { $in: Array.from(suggestedFriendIds) } }).select('-password -refreshToken');

       return res.status(200).json(suggestedFriends);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch friend suggestions", error: error.message });
    }
};

export { getFriendSuggestions,sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getUserFriends, getUserPendingRequests };