const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");
const io = require("../socket");

const User = require("../models/user");
const Post = require("../models/post");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts ",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (error) {
    console.log(error);
  }
};
exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed, entered data is incorrect.",
      errors: errors.array(),
    });
  }
  if (!req.file) {
    return res.status(422).json({
      message: "No image provided",
      errors: errors.array(),
    });
  }
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  try {
    await post.save();
    const user = await User.findById(req.userId);

    user.posts.push(post);
    await user.save();
    io.getIo().emit("posts"),
      {
        action: "create",
        post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
      };
    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(500).json({
        message: "Couldn't find the post",
        errors: errors.array(),
      });
    }
    res.status(200).json({ message: "post fetched", post: post });
  } catch (error) {
    console.log(error);
  }
};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed, entered data is incorrect.",
      errors: errors.array(),
    });
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    return res.status(422).json({
      message: "No image provided",
      errors: errors.array(),
    });
  }
  try {
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      return res.status(500).json({
        message: "Couldn't find the post",
        errors: errors.array(),
      });
    }
    if (post.creator._id.toString() !== req.userId) {
      return res.status(403).json({
        message: "Not Authorized",
        errors: errors.array(),
      });
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const result = await post.save();
    io.getIo().emit("posts", { action: "update", post: result });
    res.status(200).json({ message: "Post updated", post: result });
  } catch (error) {
    console.log(error);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(500).json({
        message: "Couldn't find the post",
        errors: errors.array(),
      });
    }
    if (post.creator.toString() !== req.userId) {
      return res.status(403).json({
        message: "Not Authorized",
        // errors: errors.array(),
      });
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIo().emit("posts", { action: "delete", post: postId });
    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    console.log(error);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
