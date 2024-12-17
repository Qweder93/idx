import { ethers } from "hardhat";
import fs from "fs";
import { formatToken } from "../../hardhat-akave/scripts/utils";
import { solidityPackedKeccak256, keccak256 } from "ethers";
import { abi } from "../../hardhat-akave/artifacts/contracts/Storage.sol/Storage.json";
import { Contract } from "ethers";

const { provider } = ethers;
const FILE_PATH = "101.bin";
const NUM_BLOCKS = 1024;

const { STORAGE } = process.env;

async function main() {
  const [deployer] = await ethers.getSigners();
  let nonce = await deployer.getNonce();

  console.log(
    `\n| Deployer: ${deployer.address} (${formatToken(
      await provider.getBalance(deployer)
    )}) [nonce: ${nonce}]`
  );

  // Read and split the file into blocks
  console.log(`\n| Reading and processing file: ${FILE_PATH}`);
  const fileData = fs.readFileSync(FILE_PATH);
  const blockSize = 1000000;

  const numberOfBlocks = Math.ceil(fileData.length / blockSize);
  console.log(`| Required: ${numberOfBlocks} blocks after splitting`);

  const dataBlocks = Array.from({ length: numberOfBlocks }, (_, i) =>
    fileData.slice(i * blockSize, (i + 1) * blockSize)
  );

  // Output size of each block for verification
  dataBlocks.forEach((block, index) => {
    console.log(`| Block ${index + 1} size: ${block.length} bytes`);
  });

  // Generate CIDs and Sizes arrays for each block
  const cids = dataBlocks.map((block) => `0x${keccak256(block).slice(2)}`);
  const sizes = dataBlocks.map((block) => block.length);

  /**
   * Deploy Storage Contract
   */
  if (!STORAGE) {
    throw new Error("STORAGE environment variable is not set.");
  }

  const storage: Contract = new ethers.Contract(STORAGE, abi, provider);
  const userA = deployer;

  // Create a Bucket
  console.log(`\n| Running process: Create a Bucket`);
  const bucketName = "StressTestBucket";
  const bucketId = solidityPackedKeccak256(
    ["string", "address"],
    [bucketName, userA.address]
  );

  const txCreateBucket = await storage
    .connect(deployer)
    .createBucket(bucketName, {
      nonce: nonce++,
    });
  console.log(
    `| Block Creation: Bucket creation transaction submitted. [Nonce: ${
      nonce - 1
    }]`
  );
  const receiptCreateBucket = await txCreateBucket.wait();
  console.log(
    `| Block Creation: Bucket created at block ${receiptCreateBucket.blockNumber}`
  );
  console.log(
    `\n| Bucket '${bucketName}' created. [Gas Used: ${receiptCreateBucket.gasUsed.toString()}]`
  );

  // Add the file with 1024 blocks, CIDs and sizes
  const fileName = "TEST_NEW_FILE_222";
  console.log(
    `\n| Adding a file with ${NUM_BLOCKS} blocks to bucket: ${bucketName}...`
  );
  console.log("Last block size is - ", sizes[sizes.length - 1]);
  const txAddFile = await storage.connect(deployer).addFile(
    "0xbb", // Example starting CID for the file
    bucketId,
    fileName,
    numberOfBlocks,
    cids,
    sizes[sizes.length - 1],
    { nonce: nonce++ }
  );
  console.log(
    `| Block Creation: File addition transaction submitted. [Nonce: ${
      nonce - 1
    }]`
  );
  const receiptAddFile = await txAddFile.wait();
  console.log(
    `| Block Creation: File added at block ${receiptAddFile.blockNumber}`
  );
  console.log(
    `Added file: ${fileName} [Gas Used: ${receiptAddFile.gasUsed.toString()}]`
  );

  // Retrieve files from the bucket
  console.log(`\n| Retrieving files from the bucket...`);
  const ownerBuckets = await storage.getOwnerBuckets(deployer.address);

  for (const bucketId of ownerBuckets) {
    const bucket = await storage.getBucketByName(bucketName);
    console.log(
      `\n| Bucket: ${bucket.name} [ID: ${bucket.id}] contains ${bucket.files.length} files`
    );

    for (const fileId of bucket.files) {
      const file = await storage.getFileById(fileId);
      console.log(
        `\n| File Name: ${file.name}, File ID: ${file.id}, File Size: ${file.size}`
      );
    }
  }

  // Cleanup: Delete all files and the bucket
  console.log(`\n| Running cleanup process...`);
  for (const bucketId of ownerBuckets) {
    const bucket = await storage.getBucketByName(bucketName);

    for (const fileId of bucket.files) {
      console.log(`\n| Deleting File with ID: ${fileId}...`);
      const txDeleteFile = await storage
        .connect(deployer)
        .deleteFile(fileId, bucket.id, fileName, true, { nonce: nonce++ });
      const receiptDeleteFile = await txDeleteFile.wait();
      console.log(
        `| File deleted at block ${
          receiptDeleteFile.blockNumber
        } [Gas Used: ${receiptDeleteFile.gasUsed.toString()}]`
      );
    }

    console.log(`\n| Deleting Bucket: ${bucketName}...`);
    const txDeleteBucket = await storage
      .connect(deployer)
      .deleteBucket(bucket.id, bucket.name, {
        nonce: nonce++,
      });
    const receiptDeleteBucket = await txDeleteBucket.wait();
    console.log(
      `| Bucket deleted at block ${
        receiptDeleteBucket.blockNumber
      } [Gas Used: ${receiptDeleteBucket.gasUsed.toString()}]`
    );
  }

  console.log(`\n| Cleanup complete.`);
  console.log(
    `\n| Deployer: ${deployer.address} (${formatToken(
      await provider.getBalance(deployer)
    )}) [nonce: ${nonce}]`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
