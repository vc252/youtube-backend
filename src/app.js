import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { __dirname } from "./constants.js";
import path from "node:path";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    // credentials: true
  })
);
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static(path.join(__dirname, "../public")));
app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
import errorHandler from "./utils/errorHandler.js";

//routes declaration
app.use("/api/v1/users", userRouter);

app.use(errorHandler);

export default app;
