const { createClient } = require("@clickhouse/client");
const jwt = require("jsonwebtoken");
const fastcsv = require("fast-csv");
const { Readable } = require("stream");
const csv = require("csv-parser");
const fs = require("fs");

require("dotenv").config();

// ei5ryiszf1.ap-south-1.aws.clickhouse.cloud
// x5aOL8.6wijU2

// tables
exports.tables = async (req, res, next) => {
  try {
    const { host, port, database, user, password } = req.body;

    const protocol = port === "9440" || port === "8443" ? "https" : "http";
    const url = `${protocol}://${host}:${port}`;
    const client = createClient({
      url: url,
      username: user,
      password: password,
    });

    const result = await client.query({
      query: "SHOW TABLES",
      format: "JSONEachRow",
    });

    const tables = await result.json();
    const tableNames = tables.map((t) => Object.values(t)[0]);

    // create jwt
    const token = await jwt.sign({ _id: url }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "connected successfully",
      userInfo: {
        host,
        port,
        database,
        user,
        password,
      },
      token,
      tables: {
        tables: tableNames,
      },
    });
  } catch (error) {
    console.error("ClickHouse connection error:", error.message);
    res.status(500).json({ error: "Failed to fetch tables from ClickHouse." });
  }
};

// columns
exports.columns = async (req, res, next) => {
  try {
    const { host, port, database, user, password, tableName } = req.body;

    const protocol = port === "9440" || port === "8443" ? "https" : "http";
    const url = `${protocol}://${host}:${port}`;

    const client = createClient({
      url: url,
      username: user,
      password: password,
    });

    const result = await client.query({
      query: `DESCRIBE TABLE ${tableName}`,
      format: "JSONEachRow",
    });

    const columns = await result.json();
    const columnNames = columns.map((col) => col.name);

    res.status(200).send({
      success: true,
      message: "columns fetched successfully",
      columns: { columns: columnNames },
    });
  } catch (error) {
    console.error("Error fetching columns:", error.message);
    res.status(500).json({ error: "Failed to fetch columns from table." });
  }
};

// to CSV
exports.toCSV = async (req, res) => {
  try {
    const {
      host,
      port,
      database,
      user,
      password,
      tableName,
      columns,
      fileName,
    } = req.body;

    const protocol = port === "9440" || port === "8443" ? "https" : "http";
    const url = `${protocol}://${host}:${port}`;

    const client = createClient({
      url: url,
      username: user,
      password: password,
    });

    // Query to fetch data from ClickHouse
    const query = `SELECT ${columns.join(", ")} FROM ${tableName}`;
    const result = await client.query({ query, format: "JSONEachRow" });
    const rows = await result.json();

    // Prepare CSV stream
    const csvChunks = [];
    const csvStream = fastcsv
      .format({ headers: true })
      .on("data", (chunk) => csvChunks.push(chunk))
      .on("end", () => {
        const csvData = Buffer.concat(csvChunks).toString("utf-8");

        // Send back both CSV data and row count in a JSON response
        res.status(200).json({
          fileName: fileName,
          rowCount: rows.length,
          csvData: csvData, // Sending CSV as string
        });
      });

    const readable = Readable.from(rows);
    readable.pipe(csvStream);
  } catch (err) {
    console.error("❌ Ingestion error:", err.message);
    res.status(500).json({ error: "Failed to generate CSV." });
  }
};

