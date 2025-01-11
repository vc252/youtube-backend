import multer from 'multer';
import path from 'node:path'
import { __dirname } from '../constants';

const storage = multer.diskStorage({
  destination: function(req,file,cb) {
    const destPath = path.join(__dirname,'../public/temp');
    cb(null,destPath)
  },
  filename: function(req,file,cb) {
    const newFileName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null,newFileName);
  }
})

const upload = multer({storage})