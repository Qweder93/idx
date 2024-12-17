import pool from "./db";

import { ethers } from "hardhat";

const { provider } = ethers;

async function getData(database: string, key: string, key_value: string) {
  const query = `SELECT * FROM ${database} WHERE ${key} = $1`;
  const values = [key_value];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}

async function updateNetworkData() {
  const network: string = (await provider.getNetwork()).name;
  const lastParsedBlock: number = await provider.getBlockNumber();
  const query = `
      UPDATE last_parsed_block
      SET block_number = $2
      WHERE network_name = $1
    `;
  const values = [network, lastParsedBlock];

  try {
    const result = await pool.query(query, values);
    console.log("Updated last managed block number");
    return result.rows[0];
  } catch (err) {
    console.error("Error updating data:", err);
  }
}
async function getContractsToListen() {
  const query = `SELECT * FROM contract_data`;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}

async function updateContractBlock(
  contractAddress: string,
  lastContractBlock: number
) {
  const query = `
      UPDATE contract_data
      SET block_number = $2
      WHERE contract_address = $1
    `;
  const values = [contractAddress, lastContractBlock];

  try {
    const result = await pool.query(query, values);
    console.log("Updated last managed block for - ", contractAddress);
  } catch (err) {
    console.error("Error updating data:", err);
  }
}

export {
  getData,
  updateNetworkData,
  getContractsToListen,
  updateContractBlock,
};
