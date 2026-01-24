const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const formRoutes = require('./routes/formRoutes');
const responseRoutes = require("./routes/responseRoutes");
const groupRoutes = require("./routes/groupRoutes");
const defaultUserIdRoutes = require("./routes/settingsRoutes");

const cors = require("cors");
app.use(cors());

const path = require('path');
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));

app.use(express.json()); // Middleware for JSON
app.use(bodyParser.json());

// Use form routes
app.use('/api', formRoutes);
app.use("/api", responseRoutes);
app.use("/api", groupRoutes);
app.use('/api', defaultUserIdRoutes);

// servir le build React
app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

