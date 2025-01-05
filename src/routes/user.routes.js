import { Router } from "express";
import { checkUsernameAvailablity, getCurrentUser, refreshAceessToken, registerUser, userLogin, userLogout } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { acceptFriendRequest, getFriendSuggestions, getUserFriends, getUserPendingRequests, rejectFriendRequest, sendFriendRequest} from "../controllers/friendship.controller.js";

const router = Router();
router.route("/login").post(userLogin);
router.route("/register").post(registerUser);
router.route("/logout").get(verifyJWT,userLogout);
router.route("/refreshAccessToken").get(refreshAceessToken);

router.route("/checkUsername/:username").get(checkUsernameAvailablity);

router.route("/getFriends").get(verifyJWT,getUserFriends);
router.route("/getPendingRequest").get(verifyJWT,getUserPendingRequests);
router.route("/acceptRequest/:requesterId").get(verifyJWT,acceptFriendRequest);
router.route("/rejectRequest/:friendId").get(verifyJWT,rejectFriendRequest);
router.route("/sendRequest/:recipientId").get(verifyJWT,sendFriendRequest);
router.route("/getFriendSuggestion").get(verifyJWT,getFriendSuggestions)
router.route("/getCurrentUser").get(verifyJWT,getCurrentUser)

export default router;