const express = require("express");
const { tables, columns, toCSV} = require("../controllers/authC");
const { uploadCSVToClickHouse } = require('../controllers/uploadC');
const multer = require("multer");
const path = require("path");

const router = express.Router();
// routing

// tables
router.post("/tables", tables);
// columns
router.post("/columns", columns);
// to CSV
router.post("/ingest/csv", toCSV);
// to Flat File


// Store uploaded files in /uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("csv"), uploadCSVToClickHouse);

module.exports = router;



module.exports = router;
