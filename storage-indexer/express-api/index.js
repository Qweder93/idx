const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = 8080;

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: 5432,
});

app.use(express.json());

app.get("/cids/:contract_address/:file_id", async (req, res) => {
  try {
    const { contract_address, file_id } = req.params;

    // Query to fetch data based on contract_address and file_id
    const query =
      "SELECT * FROM cid_data WHERE contract_address = $1 AND id = $2";
    const result = await pool.query(query, [contract_address, file_id]);

    // Handle case where no data is found
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({
          error: "No data found for the given contract address and file ID",
        });
    }

    // Convert CIDs to hex format
    const cidsHex = result.rows.flatMap((row) =>
      row.cids.map((cid) => "0x" + cid.toString("hex"))
    );

    // Respond with the converted data
    res.json(cidsHex);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

app.get("/ids/:address", async (req, res) => {
  const contractAddress = req.params.address;
  try {
    // Query to fetch IDs for the specific contract address
    const query = "SELECT id FROM cid_data WHERE contract_address = $1";
    const result = await pool.query(query, [contractAddress]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `No IDs found for contract_address: ${contractAddress}`,
      });
    }

    // Extract and return the list of IDs
    const ids = result.rows.map((row) => row.id);
    res.json(ids);
  } catch (error) {
    console.error("Error fetching IDs:", error);
    res.status(500).send("Error fetching IDs");
  }
});

app.post("/contract", async (req, res) => {
  try {
    const { contract_address, block_number } = req.body;

    // Validate the incoming data
    if (!contract_address || !block_number) {
      return res
        .status(400)
        .json({ error: "Contract address and block number are required" });
    }

    // Insert data into the contract_data table
    const query = `
      INSERT INTO contract_data (contract_address, block_number)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const result = await pool.query(query, [contract_address, block_number]);

    // Return the inserted data
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting contract data:", error);
    res.status(500).send("Error inserting contract data");
  }
});

app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
});
