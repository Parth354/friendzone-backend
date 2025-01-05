import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const options = {
    httpOnly: true,
    secure: true
}
const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken, refreshToken};
    }catch(error){
            console.log(error);
    }
}

const registerUser = async(req,res) => {
    const {name,username , email , password} = req.body;
    if ([name, email, username, password].some((field) => field?.trim() === "")) {
        return res.status(400).json({message: "All fields are required!"});
    }

    const prevUser = await User.findOne({$or: [{username}, {email}]});
    if(prevUser){
        return res.status(400).json({message: "User already exists!"});
    }
    try {
        const user = await User.create({
            username :username.toLowerCase(),
            name,
            email,
            password
        });
        await user.save()
        return userLogin(req,res)
       
    } catch (error) {
        return res.status(500).json({message: "Internal server error!" + error?.message});
    }
}

const userLogin = async(req,res) => {
    const loginCredential = req.body.loginCredential || req.body.username;
    const { password } = req.body;
    if ([loginCredential, password].some((field) => field?.trim() === "")) {
        return res.status(400).json({message: "All fields are required!"});
    }
    const user = await User.findOne({ $or: [{ email: loginCredential }, { username: loginCredential }] });
    if(!user){
        return res.status(400).json({message: "No Account Exists"});
    }
    const isPasswordMatch = await user.isPasswordMatch(password);
    if(!isPasswordMatch){
        return res.status(400).json({message: "Invalid Password!"});
    }
    try {
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json({message: "Login successful!", user: createdUser, accessToken, refreshToken});
      } catch (error) {
        return res.status(500).json({ message: 'Internal server error'+error });
      }
}

const userLogout = async(req,res) => {
    await User.findByIdAndUpdate(req.user._id,{
        $set: {refreshToken: ""}
    },{new: true});

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json({message: "Logged out successfully!"});
}

const refreshAceessToken = async(req,res) => {
    const refreshToken = req.cookies?.refreshToken
    if(!refreshToken){
        return res.status(400).json({message: "Unauthorized request!"});
    }
    try {
        const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(payload._id);
        if(!user){
            return res.status(400).json({message: "Invalid request!"});
        }
        if(user.refreshToken !== refreshToken){
            return res.status(400).json({message: "Unauthorized request!"});
        }
        const {accessToken ,refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id);
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json({message:"Access Token Refreshed Successfully",accessToken,user:createdUser,refreshToken:newRefreshToken});
    } catch (error) {
        return res.status(500).json({message: "Internal server error!" +error?.message});
    }
}

const checkUsernameAvailablity = async(req,res) => {
    const {username} = req.params;
    if(!username){
        return res.status(400).json({message: "Username is required!"});
    }
    const user = await User.findOne({  username });
    if(user){
        return res.status(400).json({message: "Username already taken!"});
    }
    else{
        return res.status(200).json({message: "Username available!"});
    }
}

const getCurrentUser = async(req,res)=>{
    const userId = req.user._id.toString()
    const user = await User.findById(userId).select("-password -refreshToken")
    if(!user){
        return res.status(400).json({message:"No User Exists"})
    }
    return res.status(200).json({message:"Fetched User Successfully!",user: user})
}


export {registerUser, userLogin, userLogout, refreshAceessToken, checkUsernameAvailablity , getCurrentUser};


