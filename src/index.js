import app from './app.js';
import 'dotenv/config'
import connectDB from './db/index.db.js';

const PORT = process.env.PORT || 8000;

connectDB()
.then(()=>{
  app.on('error',(err)=>{
    throw err;
  })
  app.listen(PORT,()=>{
    console.log(`server started PORT:${PORT}`);
  })
})
.catch((err)=>{
  console.log('server failed to start',err);
})

app.get('/',(req,res,next)=>{
  res.status(200).json({
    message: 'app started'
  })
})


