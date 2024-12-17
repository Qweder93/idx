import { ethers } from "hardhat";
import { Contract } from "ethers";
import pool from "./db";
import {
  getData,
  updateNetworkData,
  getContractsToListen,
  updateContractBlock,
} from "./db-utils";
import abi from "../abis/Storage.json";

const { STORAGE, GET_BLOCK_NUMBER } = process.env;
const { provider } = ethers;

if (!STORAGE) {
  throw new Error("STORAGE environment variable is not set.");
}

let lastTransaction: string = "0x";
const maxParse: Number = 2880;

setInterval(monitorBlocks, 10000);

console.log(
  `\n\u250F 'Script is running and listening for events...' \n\u2517`,
  STORAGE
);

async function monitorBlocks() {
  const contractData = await getContractsToListen();
  let currentBlock: number;
  // if (GET_BLOCK_NUMBER == true) {
     currentBlock = await provider.getBlockNumber();
  // } else {
    //currentBlock = await getFinalizedBlock();
  //}

  const currentBlockFalse: number = await getFinalizedBlock();
  // const currentBlock = await provider.getBlockNumber()
  console.log("Current block - ", currentBlockFalse);
  console.log("Another current block ..", await provider.getBlockNumber());
  console.log("Checking blocks...");
  contractData.forEach(async (contractData: any) => {
    const contractAddress = contractData.contract_address;
    const lastContractBlock = contractData.block_number;
    if (currentBlock == lastContractBlock) {
      await updateContractBlock(contractAddress, currentBlock);
    } else {
      console.log("New block found");
      console.log(
        `Parcing blocks for -  ${contractAddress} from ${lastContractBlock}`
      );
      await parseBlocks(lastContractBlock, currentBlock, contractAddress);
      await updateNetworkData();
      await updateContractBlock(contractAddress, currentBlock);
    }
  });
}
async function getCids(txHash: string) {
  const abi = [
    "function addFile(bytes memory cid, bytes32 bucketId, string memory name, uint256 size, bytes32[] calldata cids, uint256 lastBlockSize)",
  ];

  const iface = new ethers.Interface(abi);

  try {
    const transaction = await provider.getTransaction(txHash);
    if (transaction) {
      const decoded = iface.parseTransaction({
        data: transaction.data,
        value: transaction.value,
      });
      if (decoded != null) {
        return decoded.args[4];
      } else {
        console.log("Error decoding data!");
      }
    } else {
      console.log("Transaction not found.");
    }
  } catch (error) {
    console.error("Error fetching or decoding transaction:", error);
  }
}

async function saveCID(
  id: any,
  cids: any,
  txHash: any,
  contractAddress: string
) {
  try {
    const convertedCids = cids.map((cid: any) =>
      Buffer.from(cid.replace("0x", ""), "hex")
    );

    // Check if the ID already exists
    const checkQuery = `SELECT cids, tx_hash FROM cid_data WHERE id = $1`;
    const result = await pool.query(checkQuery, [id]);

    if (result.rows.length > 0) {
      const existingTxHash = result.rows[0].tx_hash;

      // Check if the new transaction hash is the same as the existing one
      if (existingTxHash === txHash) {
        console.log(
          `Transaction hash ${txHash} already exists for ID ${id}. No new CIDs were added.`
        );
        return;
      }

      const existingCids = result.rows[0].cids || [];
      const updatedCids = [...existingCids, ...convertedCids];

      await pool.query(`UPDATE cid_data SET cids = $2 WHERE id = $1`, [
        id,
        updatedCids,
      ]);

      console.log(
        `Appended ${convertedCids.length} CIDs to existing ID ${id}.`
      );
    } else {
      await pool.query(
        `INSERT INTO cid_data (id, cids,tx_hash,contract_address) VALUES ($1, $2, $3, $4)`,
        [id, convertedCids, txHash, contractAddress]
      );

      console.log(`Successfully inserted ID ${id} with ${cids.length} CIDs.`);
    }
  } catch (error) {
    console.error("Error inserting CID data:", error);
  }
}

async function parseBlocks(
  startBlock: Number,
  endBlock: Number,
  contractAddress: string
) {
  console.log(
    `\u2523 Getting all events between blocks: ${startBlock} and ${endBlock}`
  );
  const totalBlocks = Number(endBlock) - Number(startBlock);
  const parseIterations = Math.ceil(totalBlocks / Number(maxParse));

  if (parseIterations > 1) {
    console.log("Amount of blocks exceeds max parce value");
    console.log(`Parsing will occur in ${parseIterations} iterations.`);

    for (let i = 0; i < parseIterations; i++) {
      let chunkStart = Number(startBlock) + i * Number(maxParse);
      let chunkEnd = Math.min(
        Number(startBlock) + (i + 1) * Number(maxParse),
        Number(endBlock)
      );

      console.log(`Parsing from block ${chunkStart} to block ${chunkEnd}`);
      await _parseBlocks(chunkStart, chunkEnd, contractAddress);
    }
  } else {
    console.log(`Parsing from block ${startBlock} to block ${endBlock}`);
    await _parseBlocks(startBlock, endBlock, contractAddress);
  }
  // await checkCurrentBlock();
}

async function _parseBlocks(
  startBlock: Number,
  endBlock: Number,
  contractAddress: string
) {
  let storage: Contract = new ethers.Contract(contractAddress, abi, provider);
  const filter = storage.filters.AddFile();
  const events = await storage.queryFilter(
    filter,
    Number(startBlock),
    Number(endBlock)
  );

  console.log(`\u2523 Found ${events.length} events`);

  events.forEach(async (events) => {
    const txHash = events.transactionHash;
    const id = events.args[0];
    const cids = await getCids(txHash);
    await saveCID(id, cids, txHash, contractAddress);
  });
}

// async function lastParsedBlock() {
//   const network: string = (await provider.getNetwork()).name;
//   const responce = await getData("last_parsed_block", "network_name", network);
//   const currentBlock = await getFinalizedBlock();
//   if (responce.block_number == 0) {
//     console.log(
//       "No information about last parsed block, parcing current block."
//     );
//     return currentBlock;
//   } else {
//     return responce.block_number;
//   }
// }

async function getFinalizedBlock() {
  const finalizedBlock = await provider.send("eth_getBlockByNumber", [
    "finalized",
    false,
  ]);
  const finalizedBlockNumber = parseInt(finalizedBlock.number, 16);

  return finalizedBlockNumber;
}
