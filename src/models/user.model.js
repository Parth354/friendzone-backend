import { Schema, model } from "mongoose";
import argon2id from "argon2";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    name: {
        type:String,    
        required: true,
        trim: true,
    },
    username: {
        type:String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index:true
    },
    email: {
        type: String,
        required: true,
        index: true
    },
    refreshToken: {
        type: String,
        default: ""
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    // coverPicture: {
    //     type: String,
    //     default: "",
    // }
},{timestamps: true});

userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await argon2id.hash(this.password);
    }
    next();
});

userSchema.methods.isPasswordMatch = async function(password){
    return await argon2id.verify(this.password, password);
}

userSchema.methods.generateAccessToken = function(){
    
    return  jwt.sign(
            {_id: this._id,
            username: this.username,
            email: this.email,
            username: this.username,
        }, process.env.ACCESS_TOKEN_SECRET, {expiresIn: process.env.ACCESS_TOKEN_EXPIRY});

}

userSchema.methods.generateRefreshToken = function(){
        return  jwt.sign(
            {username: this.username,
                _id:this._id
        }, process.env.REFRESH_TOKEN_SECRET, {expiresIn: process.env.REFRESH_TOKEN_EXPIRY});   
}

export const User =model("User", userSchema);

