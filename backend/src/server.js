require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}

const app = require("./app");

const PORT = process.env.PORT || 3000;

// 0.0.0.0 so the server is reachable from outside a Docker container
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
