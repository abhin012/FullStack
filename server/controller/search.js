import question from "../models/question.js";
import post from "../models/post.js";

export const search = async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(200).json({ questions: [], posts: [] });
  }

  try {
    const regex = new RegExp(q.trim(), "i");

    const [questions, posts] = await Promise.all([
      question
        .find({
          $or: [{ questiontitle: regex }, { questionbody: regex }, { questiontags: regex }],
        })
        .limit(15),
      post
        .find({ isDeleted: false, content: regex })
        .populate("author", "name")
        .limit(15),
    ]);

    res.status(200).json({ questions, posts });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};