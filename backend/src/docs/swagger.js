const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "REST API for an e-commerce application",
      contact: {
        name: "API Support",
        email: "support@ecommerce.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Categories",
        description: "Category management endpoints",
      },
      {
        name: "Products",
        description: "Product management endpoints",
      },
    ],
  },
  // ✅ Point to ALL doc files
  apis: [
    "./src/docs/schemas/*.js",    // Schemas
    "./src/docs/paths/*.js",      // Endpoint paths
  ],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;