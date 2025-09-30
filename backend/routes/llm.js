import express from  "express"
import { generate } from "../chatbot.js";
const router = express.Router();

router.post('/chat',async  (req,res)=>{
    try{
        const message= req.body.message
        const thread = req.body.thread
        if(!message || !thread){
            res.status(400).json({error:true,message:"All fields are required"})
            return
        }
        const response=await generate(message,thread)

        res.status(200).json({error:false,message:response})
    }catch(error){
        res.status(500).json({error:true,message:error})
    }
})

export default router