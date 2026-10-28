

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "ShopEasy API is running!" });
});

// API routes
app.use("/api/auth", require("./Routes/authRoute"));
app.use("/api/products", require("./routes/productRoute"));
app.use("/api/orders", require("./routes/orderRoute"));
app.use("/api/admin", require("./Routes/adminRoute"));

// Unknown endpoint (keep this after all routes)
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found."
  });
});

// Error handler (keep this last)
app.use((error, req, res, next) => {
  console.error("API error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    message: "A server error occurred."
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`ShopEasy server: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

