const express = require("express");
const connectDB = require("./config/db");
const path = require('path');
const fileupload = require('express-fileupload');

const app = express();

const PORT = process.env.PORT || 5000;

//connectDB

connectDB();
//init middleware

app.use(express.json());

//File uploading

app.use(fileupload(path.join(__dirname, 'public')));

//Mount route

app.use("/api/users", require("./routes/users"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/story", require("./routes/story"));

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
  );
}

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
