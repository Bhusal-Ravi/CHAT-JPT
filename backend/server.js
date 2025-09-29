import express from "express";
import cors from 'cors';
import llmRoute from './routes/llm.js'


const app= express ();
const port=3001;


app.use(express.json());
app.use(
    cors({
        origin:process.env.ALLOWED_ORIGIN,
          methods:"GET,POST,PUT,DELETE",
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
)
app.use('/api',llmRoute)

app.listen(port,()=>{
    console.log(`Server Started in Port: ${port}`)
})