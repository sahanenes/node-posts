const User = require("../models/user");
const { validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed, entered data is incorrect.",
      errors: errors.array(),
    });
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      name: name,
      password: hashedPassword,
    });

    const result = await user.save();

    res.status(201).json({ message: "User created", userId: result._id });
  } catch (error) {
    console.log(error);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({
        message: "A user with this email could not be found",
        // error: error.array(),
      });
    }
    loadedUser = user;
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return res.status(401).json({
        message: "Wrong password",
        errors: errors.array(),
      });
    }
    const token = jwt.sign(
      {
        email: loadedUser.email,
        userId: loadedUser._id.toString(),
      },
      "somesupersecretsecret",
      { expiresIn: "1h" }
    );
    res.status(200).json({ token: token, userId: loadedUser._id.toString() });
  } catch (error) {
    console.log(error);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errors: errors.array(),
      });
    }
    res.status(200).json({ status: user.status });
  } catch (error) {
    console.log(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  const newStatus = req.body.status;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errors: errors.array(),
      });
    }
    user.status = newStatus;
    await user.save();
    res.status(200).json({ message: "user updated" });
  } catch (error) {
    console.log(error);
  }
};
