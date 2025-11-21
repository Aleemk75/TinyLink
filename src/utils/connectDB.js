import mongoose from "mongoose";
import "dotenv/config";

const MONGO_URI = process.env.MONGO_URI;

   export async function connectdb() {
         await mongoose.connect(MONGO_URI);
         console.log("connecting....")
    }

    