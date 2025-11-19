const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DeepSea Archives - Auth Service API",
      version: "1.0.0",
      description:
        "Service d'authentification et de gestion des utilisateurs pour DeepSea Archives",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Auth Service",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            email: { type: "string", format: "email" },
            username: { type: "string" },
            role: { type: "string", enum: ["USER", "EXPERT", "ADMIN"] },
            reputation: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
