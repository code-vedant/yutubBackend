import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken
  
  if (!token) {
    return res.status(401).json({ success: false, message: "Not Authorized" });
  }
  
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid Access Token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error?.message || "Invalid Access Token" });
  }
});
