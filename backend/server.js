const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
//const emailsRouter = require("./routes/emails");
const authRouter = require("./routes/auth");
const syncRouter = require("./routes/sync");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error", err));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});


// mount routers BEFORE listen
//app.use("/api/emails", emailsRouter);
app.use("/auth", authRouter);

app.use("/api", syncRouter);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
