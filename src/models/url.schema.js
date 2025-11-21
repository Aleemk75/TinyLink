import mongoose from "mongoose";

const Schema = mongoose.Schema;

let urlSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    url: {
        type: String,
        required: true,
    },
    clicks:{
        type:Number,

    },
    lastClicked:{
        type:Date,
    }
}, 
{timestamps:true});

const Url = mongoose.model("Url" , urlSchema);

export default Url;