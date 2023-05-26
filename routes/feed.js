const express = require("express");
const { query } = require("express-validator");

const feedController = require("../controllers/feed");

const router = express.Router();

// GET /feed/posts
router.get("/posts", feedController.getPosts);

// POST /feed/post
router.post(
  "/post",
  [
    query("title").trim().isLength({ min: 5 }),
    query("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

module.exports = router;
