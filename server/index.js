import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js"
import questionroute from "./routes/question.js"
import answerroutes from "./routes/answer.js"
import postroute from "./routes/post.js";
import commentroute from "./routes/comment.js";
import reportroute from "./routes/report.js";
import notificationroute from "./routes/notification.js";
import paymentroute from "./routes/payment.js";
import reputationroute from "./routes/reputation.js";
import languageroute from "./routes/language.js";
import sessionroute from "./routes/session.js";
import searchroute from "./routes/search.js";

const app = express();
dotenv.config();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.get("/", (req, res) => {
  res.send("Stackoverflow clone is running perfect");
});
app.use('/user',userroutes)
app.use('/question',questionroute)
app.use('/answer',answerroutes)
app.use('/post', postroute);
app.use('/comment', commentroute);
app.use('/report', reportroute);
app.use('/notification', notificationroute);
app.use('/payment', paymentroute);
app.use('/reputation', reputationroute);
app.use('/language', languageroute);
app.use('/session', sessionroute);
app.use('/search', searchroute);

const PORT = process.env.PORT || 5000;
const databaseurl = process.env.MONGODB_URL;

mongoose
  .connect(databaseurl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });
