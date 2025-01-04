import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
export const verifyJWT = async(req,res,next) => {
try {
    const token =req.cookies?.accessToken ||req.headers["authorization"]?.split(" ")[1];
    if(!token){
        return res.status(401).json({message: "Unauthorized request!"});
    }
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(payload._id).select("-password -refreshToken");
    if(!user){
        return res.status(401).json({message: "Invalid Token!"});
    }
    req.user ={
        _id: user._id,
        credential: user.username,
        }
    next();
} catch (error) {
    return res.status(500).json({message: "Internal server error!" + error?.message});
}
}