const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DeepSea Archives - Observation Service API",
      version: "1.0.0",
      description:
        "Service de gestion des espèces et observations pour DeepSea Archives",
    },
    servers: [
      {
        url: "http://localhost:3002",
        description: "Observation Service",
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
        Species: {
          type: "object",
          properties: {
            id: { type: "integer" },
            authorId: { type: "integer" },
            name: { type: "string" },
            rarityScore: { type: "number", format: "float" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Observation: {
          type: "object",
          properties: {
            id: { type: "integer" },
            speciesId: { type: "integer" },
            authorId: { type: "integer" },
            description: { type: "string" },
            status: {
              type: "string",
              enum: ["PENDING", "VALIDATED", "REJECTED"],
            },
            validatedBy: { type: "integer", nullable: true },
            validatedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
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
