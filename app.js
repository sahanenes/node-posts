const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
var cors = require("cors");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();
require("dotenv").config();

const URL = process.env.URL;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

app.use(
  multer({
    storage: storage,
    fileFilter: fileFilter,
  }).single("image")
);

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE",
    "allowedHeaders,socket.io"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);
app.use(cors());

mongoose
  .connect(`${URL}`)
  .then((result) => {
    const server = app.listen(8080);

    const io = require("/socket").init(
      server,

      {
        cors: {
          origin: "*",
          methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          allowedHeaders: ["Content-Type", "Authorization"],
          credentials: true,
        },
      }
    );

    io.on(
      "connection",

      (socket) => {
        console.log("client connected");
      }
    );
  })
  .catch((err) => console.log(err));
