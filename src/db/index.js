import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async () => {
    try {
      const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      console.log(`\n MongoDB connected !! Db Host : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB CONNECTION ERROR",error);
        process.exit(1)
    }
   //console.log("🔍 Full MongoDB URI:", `${process.env.MONGODB_URI}/${DB_NAME}`);

}

export default connectDB