const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.get("Authorization").split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "somesupersecretsecret");
  } catch (error) {
    return res.status(500).json({
      error: error.array(),
    });
  }
  if (!decodedToken) {
    return res.status(401).json({
      message: "Not Authenticated",
      errors: errors.array(),
    });
  }
  req.userId = decodedToken.userId;
  next();
};
