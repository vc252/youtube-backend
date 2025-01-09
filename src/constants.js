import {fileURLToPath} from 'url';
import { dirname } from 'path';

const DB_NAME = 'videotube'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export {DB_NAME,__dirname}