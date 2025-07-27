import {asyncHandeler} from "../utils/asyncHandeler.js"
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

//console.log("For req.log",req.files)
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

const existedUser =  await User.findOne({
    $or: [{ userName },{ email }]
})

if(existedUser){
    throw new ApiError(409,"User with email or username already exists")
}

// for checking image and avatar 
const avatarFile = req.files?.avatar?.[0];
const coverImageFile = req.files?.coverImage?.[0];

console.log("📂 Avatar File Object:", avatarFile); // DEBUG

const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required!")
}

console.log(avatarLocalPath)

const avatar = await uploadOnCloudinary(avatarLocalPath, `${userName}-avatar`, "user/avatar")
const coverImage = await uploadOnCloudinary(coverImageLocalPath, `${userName}-coverImage`, "user/coverImage")

if(!avatar){
    throw new ApiError(400,"Avatar upload fail!")
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

//remove password and refresh token fields from response

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)
//check for user creation
if(!createdUser){
    throw new ApiError(500,"something went wrong while registring the user")
}

//return response
return res.status(201).json(
    new ApiResponse(200,createdUser,"User registred Successfully")
)

})

export {registerUser}