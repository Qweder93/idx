
import  pool from "./db";


async function readCidDataFromDB(id:any) {
    try {
        const query = 'SELECT * FROM cid_data WHERE id = $1';
        const values = [id];
        const res = await pool.query(query, values);
        
  
      res.rows.forEach(row => {
        const cidsHex = row.cids.map(cid => '0x' + cid.toString('hex'));
  
        console.log(`CIDs: ${cidsHex}`);
      });
  
    } catch (error) {
      console.error('Error reading CID data:', error);
    } 
  }

async function main() {
    await readCidDataFromDB("0x92b3606f4676437a282a84ef92882f55f72d8d06fabe61e7762ce089f3b30bff")
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
