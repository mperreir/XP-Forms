const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'pwd7',
  host: 'localhost',
  port: 5432, // default Postgres port
  database: 'PTrans'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};