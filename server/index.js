const express = require("express");
const cors = require("cors");
require("dotenv").config();
const clickhouseRoutes = require("./routes/clickhouse");


const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

// routes
app.use("/clickhouse", clickhouseRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("<h1>welcome</h1>");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
