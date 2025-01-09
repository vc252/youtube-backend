import express from 'express';
import 'dotenv/config'
import connectDB from './db/index.js';

const PORT = process.env.PORT;

connectDB();
const app = express();

app.get('/',(req,res,next)=>{
  res.status(200).json({
    message: 'app started'
  })
})

app.listen(PORT,()=>{
  console.log(`server started PORT:${PORT}`);
})

