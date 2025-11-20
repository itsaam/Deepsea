const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "DeepSea Archives - Taxonomy Service API",
            version: "1.0.0",
            description:
                "Service d'analyse taxonomique et de modération avancée pour DeepSea Archives. " +
                "Fournit des statistiques, classifications hiérarchiques et historisation des actions.",
        },
        servers: [
            {
                url: "http://localhost:5002",
                description: "Taxonomy Service",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT token obtenu depuis auth-service",
                },
            },
            schemas: {
                TaxonomyStats: {
                    type: "object",
                    properties: {
                        summary: {
                            type: "object",
                            properties: {
                                totalSpecies: { type: "integer", description: "Nombre total d'espèces" },
                                totalObservations: { type: "integer", description: "Nombre total d'observations valides" },
                                averageObservationsPerSpecies: { type: "number", description: "Moyenne d'observations par espèce" },
                            },
                        },
                        occurrencesBySpecies: {
                            type: "object",
                            additionalProperties: { type: "integer" },
                            description: "Nombre d'occurrences par ID d'espèce",
                        },
                        keywords: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    keyword: { type: "string" },
                                    count: { type: "integer" },
                                },
                            },
                            description: "Mots-clés récurrents dans les descriptions",
                        },
                        classification: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    family: { type: "string", description: "Nom de la famille" },
                                    speciesCount: { type: "integer", description: "Nombre d'espèces dans cette famille" },
                                    totalObservations: { type: "integer", description: "Total d'observations pour cette famille" },
                                    branches: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                branch: { type: "string", description: "Branche évolutive (lettre)" },
                                                species: {
                                                    type: "array",
                                                    items: { $ref: "#/components/schemas/SpeciesInfo" },
                                                },
                                            },
                                        },
                                    },
                                    species: {
                                        type: "array",
                                        items: { $ref: "#/components/schemas/SpeciesInfo" },
                                    },
                                },
                            },
                            description: "Classification hiérarchique par famille",
                        },
                    },
                },
                SpeciesInfo: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        name: { type: "string" },
                        scientificName: { type: "string" },
                        observations: { type: "integer", description: "Nombre d'observations" },
                        subspecies: { type: "string", nullable: true, description: "Sous-espèce si détectée" },
                    },
                },
                Audit: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        type: {
                            type: "string",
                            enum: ["DELETE", "RESTORE", "VALIDATE", "REJECT"],
                            description: "Type d'action effectuée"
                        },
                        observationId: { type: "integer", nullable: true },
                        speciesId: { type: "integer", nullable: true },
                        userId: { type: "integer", nullable: true },
                        details: { type: "string", description: "Détails JSON de l'action" },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                UserHistory: {
                    type: "object",
                    properties: {
                        userId: { type: "integer" },
                        totalEvents: { type: "integer", description: "Nombre total d'événements" },
                        history: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Audit" },
                        },
                    },
                },
                SpeciesHistory: {
                    type: "object",
                    properties: {
                        speciesId: { type: "integer" },
                        totalEvents: { type: "integer", description: "Nombre total d'événements" },
                        history: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Audit" },
                        },
                    },
                },
                Observation: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        speciesId: { type: "integer" },
                        authorId: { type: "integer" },
                        description: { type: "string" },
                        status: { type: "string", enum: ["PENDING", "VALIDATED", "REJECTED"] },
                        deleted: { type: "boolean" },
                        deletedBy: { type: "integer", nullable: true },
                        deletedAt: { type: "string", format: "date-time", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                Success: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        message: { type: "string" },
                        observation: { $ref: "#/components/schemas/Observation" },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                        details: { type: "string" },
                    },
                },
            },
        },
        tags: [
            {
                name: "Taxonomy",
                description: "Analyse taxonomique et statistiques",
            },
            {
                name: "Admin",
                description: "Modération avancée et historisation (ADMIN/EXPERT)",
            },
        ],
    },
    apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
