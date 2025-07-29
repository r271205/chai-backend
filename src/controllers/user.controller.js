import {asyncHandeler} from "../utils/asyncHandeler.js"
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()//generateAccessToken
        const refreshToken = user.generateRefreshToken()  

        user.refreshToken = refreshToken
         await user.save({ validateBeforeSave : false })

         return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"somthing went wrong while generating refresh and access token")
    }
}

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
//console.log("email:",email);   



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
//const coverImageLocalPath = req.files?.coverImage[0]?.path;

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
    coverImageLocalPath = req.files.coverImage[0].path
}

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


const loginUser =  asyncHandeler(async(req,res)=>{
    // req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie


    const {email ,userName,password} = req.body
    console.log(email);

    if(!userName && !email){
        throw new ApiError(400,"username or password is required!")
    }

    const user = await User.findOne({
        $or:[{userName},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does'nt exist!")
    }

    const isPasswordValid =  await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"invalid user credentials!")
    }

   const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
    httpOnly : true,
    secure :true
   }

   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(
        200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "User logged In Successfully!"
    )
   )


})

const logoutUser = asyncHandeler(async(req,res)=>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

   const options = {
    httpOnly : true,
    secure :true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200 ,{},"User logged Out!"))

})


const refreshAccessToken = asyncHandeler(async(req,res)=>{
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken 

   if(incomingRefreshToken){
    throw new ApiError(401,"unauthorized request!")
   }

try {
       const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
       )
    
       const user = await User.findById(decodedToken?._id)
    
      if(!user){
        throw new ApiError(401,"Invalid refresh token!")
       }
    
       if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token is expirred or used")
       }
    
       const options ={
        httpOnly:true,
        secure:true
       }
    
       const {accessToken,newRefreshToken} =await generateAccessAndRefreshTokens(user._id)
    
       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",newRefreshToken,options)
       .json(
        new ApiResponse(
            200,
            { accessToken,refreshToken:newRefreshToken },
            "Access token refreshed"
            
        )
       )
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token!")
}
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken

}