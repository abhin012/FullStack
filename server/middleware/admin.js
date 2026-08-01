import user from "../models/auth.js";

const admin = async (req, res, next) => {
  try {
    const currentUser = await user.findById(req.userid);
    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({ message: "admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

export default admin;