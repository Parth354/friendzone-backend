import { Router } from "express";
import { checkUsernameAvailablity, refreshAceessToken, registerUser, userLogin, userLogout } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { acceptFriendRequest, getUserFriends, getUserPendingRequests, rejectFriendRequest, sendFriendRequest} from "../controllers/friendship.controller.js";

const router = Router();
router.route("/login").post(userLogin);
router.route("/register").post(registerUser);
router.route("/logout").get(verifyJWT,userLogout);
router.route("/refreshAccessToken").get(refreshAceessToken);

router.route("/checkUsername").post(checkUsernameAvailablity);

router.route("/getFriends/:userId").get(verifyJWT,getUserFriends);
router.route("/getPendingRequests/:userId").get(verifyJWT,getUserPendingRequests);
router.route("/acceptRequest/:requesterId").get(verifyJWT,acceptFriendRequest);
router.route("/rejectRequest/:friendId").get(verifyJWT,rejectFriendRequest);
router.route("/sendRequest/:recipientId").get(verifyJWT,sendFriendRequest);

export default router;