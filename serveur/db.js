const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'ghassen',
  host: 'localhost',
  port: 5432, // default Postgres port
  database: 'PTrans'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};