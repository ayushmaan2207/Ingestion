const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { createClient } = require("@clickhouse/client");

const inferDataTypes = (row) => {
  return row.map((value) => {
    if (!value) return "String";
    if (!isNaN(parseInt(value)) && Number.isInteger(Number(value))) return "Int32";
    if (!isNaN(parseFloat(value))) return "Float64";
    if (value.toLowerCase() === "true" || value.toLowerCase() === "false") return "Bool";
    return "String";
  });
};

const uploadCSVToClickHouse = async (req, res) => {
  const { host, port, database, user, password, tableName } = req.body;
  const file = req.file;

  if (!file || !host || !port || !user || !password || !tableName) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const filePath = path.resolve(file.path);
  const protocol = (port === "9440" || port === "8443") ? "https" : "http";
  const url = `${protocol}://${host}:${port}`;

  const client = createClient({
    url,
    username: user,
    password: password,
    database,
  });

  try {
    await client.ping();

    // Step 1: Read headers and sample row
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    let headers = [];
    let sampleRow = [];
    let lineCount = 0;

    for await (const line of rl) {
      const values = line.split(",");
      if (lineCount === 0) headers = values.map((v) => v.trim());
      else if (lineCount === 1) {
        sampleRow = values.map((v) => v.trim());
        break;
      }
      lineCount++;
    }

    if (!headers.length || !sampleRow.length) {
      throw new Error("CSV file is empty or malformed.");
    }

    // Step 2: Infer types
    const types = inferDataTypes(sampleRow);

    // Step 3: Construct CREATE TABLE query
    const columns = headers.map((header, i) => `\`${header}\` ${types[i]}`).join(", ");
    const createQuery = `
      CREATE TABLE IF NOT EXISTS \`${database}\`.\`${tableName}\` (
        ${columns}
      )
      ENGINE = MergeTree()
      ORDER BY tuple();
    `;

    // Step 4: Run CREATE TABLE query
    await client.command({ query: createQuery });

    // Step 5: Insert CSV data
    const stream = fs.createReadStream(filePath);
    await client.insert({
      table: tableName,
      values: stream,
      format: "CSV",
    });

    res.status(200).json({
      success: true,
      message: "CSV uploaded" 
    });

  } catch (err) {
    console.error("ClickHouse error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Temp file cleanup failed:", err);
    });
  }
};

module.exports = { uploadCSVToClickHouse };
