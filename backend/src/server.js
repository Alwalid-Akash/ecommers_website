const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");


const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});