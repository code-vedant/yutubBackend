import jwt from 'jsonwebtoken';

const generateAccessToken = (userId,res) => {
    const token = jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,{expiresIn : "7d"} );

    res.cookie("accessToken",token,{
        httpOnly : true,
        secure : process.env.NODE_ENV !== "development",
        sameSite : "strict",
        maxAge : 7 * 24 * 60 * 60 * 1000
    });

    return token;
}

export default generateAccessToken;