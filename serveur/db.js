const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'ghassen',
  host: 'postgres', // localhost
  port: 5432,
  database: 'PTrans'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
