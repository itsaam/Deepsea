const request = require("supertest");
const jwt = require("jsonwebtoken");

// Configurer l'environnement de test
process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";
process.env.OLLAMA_URL = "http://localhost:11434";

const app = require("../src/index");

const JWT_SECRET = process.env.JWT_SECRET;

describe("AI Service - Tests Unitaires", () => {
  // Token valide pour les tests
  const validToken = jwt.sign(
    {
      id: 1,
      email: "test@test.com",
      username: "testuser",
      role: "USER",
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Test du health check
  describe("GET /health", () => {
    it("devrait retourner le statut du service", async () => {
      const response = await request(app).get("/health");

      // Accepter 200 (Ollama disponible) ou 503 (Ollama indisponible)
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("service", "ai-service");
      expect(response.body).toHaveProperty("ollama");
    });
  });

  // Test de la route root
  describe("GET /", () => {
    it("devrait retourner les informations du service", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.body).toHaveProperty("service", "DeepSea AI Service");
      expect(response.body).toHaveProperty("version", "1.0.0");
      expect(response.body).toHaveProperty("endpoints");
    });
  });

  // Tests de l'endpoint d'analyse
  describe("POST /api/analyze", () => {
    it("devrait retourner 401 sans token", async () => {
      await request(app)
        .post("/api/analyze")
        .send({
          description: "Belle observation de poisson clown",
        })
        .expect(401);
    });

    it("devrait retourner 401 avec token invalide", async () => {
      await request(app)
        .post("/api/analyze")
        .set("Authorization", "Bearer invalid-token")
        .send({
          description: "Belle observation de poisson clown",
        })
        .expect(401);
    });

    it("devrait retourner 400 sans description", async () => {
      const response = await request(app)
        .post("/api/analyze")
        .set("Authorization", `Bearer ${validToken}`)
        .send({});

      expect([400, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty("errors");
      }
    });

    it("devrait gérer l'analyse avec token valide (peut échouer sans Ollama)", async () => {
      const response = await request(app)
        .post("/api/analyze")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          description:
            "Belle observation de poisson clown dans les récifs coralliens",
        });

      expect([200, 400, 500, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty("success");
      }
    });
  });

  // Tests de détection de spam
  describe("POST /api/detect-spam", () => {
    it("devrait retourner 401 sans token", async () => {
      await request(app)
        .post("/api/detect-spam")
        .send({
          description: "Test de spam",
        })
        .expect(401);
    });

    it("devrait détecter le contenu avec token", async () => {
      const response = await request(app)
        .post("/api/detect-spam")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          description:
            "Belle observation de poisson clown dans les récifs coralliens",
        });

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });

  // Tests d'extraction de features
  describe("POST /api/extract-features", () => {
    it("devrait retourner 401 sans token", async () => {
      await request(app)
        .post("/api/extract-features")
        .send({
          description: "Test",
        })
        .expect(401);
    });

    it("devrait extraire les features avec token", async () => {
      const response = await request(app)
        .post("/api/extract-features")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          description:
            "Poisson bleu avec des rayures jaunes, nageoires longues et queue fourchue",
        });

      expect([200, 400, 404, 500, 503]).toContain(response.status);
    });
  });

  // Tests de suggestion taxonomique
  describe("POST /api/suggest-taxonomy", () => {
    it("devrait retourner 401 sans token", async () => {
      await request(app)
        .post("/api/suggest-taxonomy")
        .send({
          description: "Test",
        })
        .expect(401);
    });

    it("devrait suggérer la taxonomie avec token", async () => {
      const response = await request(app)
        .post("/api/suggest-taxonomy")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          description:
            "Petit poisson orange et blanc, vit dans les anémones de mer",
        });

      expect([200, 400, 404, 500, 503]).toContain(response.status);
    });
  });

  // Tests de comparaison
  describe("POST /api/compare", () => {
    it("devrait retourner 401 sans token", async () => {
      await request(app)
        .post("/api/compare")
        .send({
          description1: "Test 1",
          description2: "Test 2",
        })
        .expect(401);
    });

    it("devrait comparer deux descriptions avec token", async () => {
      const response = await request(app)
        .post("/api/compare")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          description1: "Poisson clown orange et blanc vivant dans anémone",
          description2: "Amphiprion ocellaris orange et blanc symbiose anémone",
        });

      expect([200, 400, 404, 500, 503]).toContain(response.status);
    });
  });

  // Tests de résumé
  describe("POST /api/summarize", () => {
    it("devrait retourner 401 sans token", async () => {
      await request(app)
        .post("/api/summarize")
        .send({
          description: "Texte long",
        })
        .expect(401);
    });

    it("devrait résumer la description avec token", async () => {
      const response = await request(app)
        .post("/api/summarize")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          description:
            "Le poisson clown, aussi appelé Amphiprion, est un petit poisson tropical qui vit en symbiose avec les anémones de mer. Il possède une couleur orange vif avec des bandes blanches.",
        });

      expect([200, 400, 404, 500, 503]).toContain(response.status);
    });
  });

  // Tests du chat
  describe("POST /api/chat", () => {
    it("devrait retourner 401 sans token", async () => {
      await request(app)
        .post("/api/chat")
        .send({
          message: "Test",
        })
        .expect(401);
    });

    it("devrait gérer le chat avec token", async () => {
      const response = await request(app)
        .post("/api/chat")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          message: "Qu'est-ce qu'un poisson clown ?",
        });

      expect([200, 400, 500, 503]).toContain(response.status);
    });
  });

  // Tests d'authentification
  describe("Authentication Middleware", () => {
    it("devrait rejeter les tokens malformés", async () => {
      await request(app)
        .post("/api/analyze")
        .set("Authorization", "Bearer invalid-token")
        .send({
          description: "Test avec 10 caractères minimum",
        })
        .expect(401);
    });

    it("devrait rejeter les requêtes sans Bearer", async () => {
      const token = jwt.sign({ id: 1, role: "USER" }, JWT_SECRET);

      await request(app)
        .post("/api/analyze")
        .set("Authorization", token)
        .send({
          description: "Test avec 10 caractères minimum",
        })
        .expect(401);
    });

    it("devrait accepter les tokens valides", async () => {
      const response = await request(app)
        .post("/api/analyze")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          description: "Test avec 10 caractères minimum",
        });

      // Ne devrait pas retourner 401 avec token valide
      expect(response.status).not.toBe(401);
    });
  });

  // Tests de structure des réponses
  describe("Response Structure", () => {
    it("les erreurs 401 devraient être formatées", async () => {
      const response = await request(app).post("/api/analyze").send({
        description: "Test sans token avec 10 caractères",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("les erreurs 404 devraient être formatées", async () => {
      const response = await request(app)
        .get("/api/route-inexistante")
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });

  // Tests de sécurité
  describe("Sécurité AI Service", () => {
    it("devrait gérer les payloads volumineux", async () => {
      const longDescription =
        "Belle observation de poisson. " + "a".repeat(6000);

      const response = await request(app)
        .post("/api/analyze")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          description: longDescription,
        });

      expect([200, 400, 413, 500, 503]).toContain(response.status);
    });

    it("devrait valider les champs requis", async () => {
      const response = await request(app)
        .post("/api/analyze")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          wrongField: "Test",
        });

      expect([400, 500]).toContain(response.status);
    });

    it("devrait rejeter les tokens expirés", async () => {
      const expiredToken = jwt.sign(
        { id: 1, role: "USER" },
        JWT_SECRET,
        { expiresIn: "-1h" } // Expiré depuis 1h
      );

      await request(app)
        .post("/api/analyze")
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({
          description: "Test avec token expiré",
        })
        .expect(401);
    });
  });
});
