const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");


const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const app = express();

app.use(cors());



app.use(express.json());
app.get("/", (req, res) => {
  res.json({
    message: "E-commerce API is running",
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);


app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use(errorHandler);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});