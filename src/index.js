//i was having problem in accessing .env file if i imported app before it
//maybe bcz the controllers in routes attached to it need acccess which it was not getting
//so we need to import it first not after app.js
import "dotenv/config";
import app from "./app.js";
import connectDB from "./db/index.db.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.on("error", (err) => {
      throw err;
    });
    app.listen(PORT, () => {
      console.log(`server started PORT:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("server failed to start", err);
  });
