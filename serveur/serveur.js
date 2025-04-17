const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const formRoutes = require('./routes/formRoutes');
const responseRoutes = require("./routes/responseRoutes");

const cors = require("cors");
app.use(cors());



app.use(express.json()); // Middleware for JSON
app.use(bodyParser.json());

// Use form routes
app.use('/api', formRoutes);
app.use("/api", responseRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});