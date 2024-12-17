import { Pool } from "pg";

// const pool = new Pool({
//   user: "ppp",
//   host: "localhost",
//   database: "akave",
//   password: "1111",
//   port: 5432,
// });

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: 5432,
});

export default pool;
