import {asyncHandeler} from "../utils/asyncHandeler.js"
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandeler(async(req,res)=>{
//get user details from frontend
//validation - not enmpty
// check if user already exists:username,email
//check for images ,check for avtar
//upload them to cloudinary,avatar
//create user object -create entry in db
//remove password and refresh token fields from response
//check for user creation
//return response

const {fullName,email,userName,password}   =req.body
console.log("email:",email);   

if(
    [fullName,email,userName,password].some((field)=>
    field?.trim()==="")
){
    throw new ApiError(400,"All fields are required !") 
}

const existedUser = User.findOne({
    $or: [{ userName },{ email }]
})

if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
}

// for checking image and avatar 

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required!")
}

// upload on cloudinary 

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400,"Avatar file is required!")
}

//entry in database

const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    userName:userName.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500,"something went wrong while registring the user")
}

return res.status(201).json(
    new ApiResponse(200,createdUser,"User registred Successfully")
)

})

export {registerUser}