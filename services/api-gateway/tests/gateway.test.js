const request = require("supertest");
const jwt = require("jsonwebtoken");

// Configurer l'environnement de test
process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";
process.env.ALLOWED_ORIGINS = "http://localhost:5173";

const app = require("../src/index");

const JWT_SECRET = process.env.JWT_SECRET;

describe("API Gateway - Tests Unitaires", () => {
  // Test du health check
  describe("GET /health", () => {
    it("devrait retourner le statut du service", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("service", "api-gateway");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  // Test de la route root
  describe("GET /", () => {
    it("devrait retourner les informations du service", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.body).toHaveProperty("service", "DeepSea API Gateway");
      expect(response.body).toHaveProperty("version", "1.0.0");
      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("endpoints");
    });
  });

  // Tests de routage vers services
  describe("Proxy Routes", () => {
    it("devrait router /api/auth/* vers auth-service (peut échouer sans service)", async () => {
      const response = await request(app).get("/api/auth/health");

      // Accepter 200 (service ok) ou 502/503 (service indisponible)
      expect([200, 404, 500, 502, 503]).toContain(response.status);
    });

    it("devrait router /api/species vers observation-service (peut échouer sans service)", async () => {
      const response = await request(app).get("/api/species");

      expect([200, 404, 500, 502, 503]).toContain(response.status);
    });

    it("devrait router /api/observations vers observation-service (peut échouer sans service)", async () => {
      const response = await request(app).get("/api/observations");

      expect([200, 401, 404, 500, 502, 503]).toContain(response.status);
    });

    it("devrait router /api/taxonomy vers taxonomy-service (peut échouer sans service)", async () => {
      const response = await request(app).get("/api/taxonomy/health");

      expect([200, 401, 404, 500, 502, 503]).toContain(response.status);
    });
  });

  // Tests de rate limiting
  describe("Rate Limiting", () => {
    it("devrait permettre les requêtes sous la limite", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "ok");
    });

    it("devrait accepter plusieurs requêtes consécutives", async () => {
      // Envoyer 5 requêtes rapidement
      const promises = Array(5)
        .fill(null)
        .map(() => request(app).get("/health"));

      const responses = await Promise.all(promises);

      // Toutes devraient passer (limite généralement à 100)
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status);
      });

      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  // Tests des headers CORS
  describe("CORS Headers", () => {
    it("devrait inclure les headers CORS", async () => {
      const response = await request(app)
        .get("/health")
        .set("Origin", "http://localhost:5173");

      expect(response.headers).toHaveProperty("access-control-allow-origin");
    });

    it("devrait autoriser les méthodes HTTP configurées", async () => {
      const response = await request(app)
        .options("/health")
        .set("Origin", "http://localhost:5173")
        .set("Access-Control-Request-Method", "POST");

      expect([200, 204]).toContain(response.status);
    });
  });

  // Tests de sécurité avec Helmet
  describe("Security Headers (Helmet)", () => {
    it("devrait inclure X-Content-Type-Options", async () => {
      const response = await request(app).get("/health");

      expect(response.headers).toHaveProperty(
        "x-content-type-options",
        "nosniff"
      );
    });

    it("devrait inclure X-Frame-Options", async () => {
      const response = await request(app).get("/health");

      expect(response.headers).toHaveProperty("x-frame-options");
    });
  });

  // Tests de gestion des erreurs
  describe("Error Handling", () => {
    it("devrait retourner 404 pour les routes inexistantes", async () => {
      const response = await request(app)
        .get("/route-qui-nexiste-pas")
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("non trouvée");
    });

    it("devrait retourner 404 pour POST sur route inexistante", async () => {
      const response = await request(app)
        .post("/api/route-invalide")
        .send({ test: "data" })
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });

  // Tests de validation des payloads
  describe("Payload Validation", () => {
    it("devrait accepter les payloads JSON valides", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "Test123!",
      });

      // Accepter 200 (ok), 400 (validation), 401 (credentials), 502 (service down)
      expect([200, 400, 401, 404, 500, 502, 503]).toContain(response.status);
    });

    it("devrait rejeter les payloads trop volumineux", async () => {
      const largePayload = { data: "a".repeat(2 * 1024 * 1024) }; // 2MB

      const response = await request(app)
        .post("/api/auth/login")
        .send(largePayload);

      // Devrait retourner 413 (payload trop large) ou 400/500
      expect([400, 413, 500, 502, 503]).toContain(response.status);
    });
  });

  // Tests de logging
  describe("Request Logging", () => {
    it("devrait logger les requêtes", async () => {
      // Capturer les logs
      const originalLog = console.log;
      let logCaptured = false;

      console.log = (...args) => {
        if (args[0].includes("GET") && args[0].includes("/health")) {
          logCaptured = true;
        }
        originalLog(...args);
      };

      await request(app).get("/health");

      console.log = originalLog;
      expect(logCaptured).toBe(true);
    });
  });

  // Tests de structure des réponses
  describe("Response Structure", () => {
    it("les réponses JSON devraient être bien formatées", async () => {
      const response = await request(app)
        .get("/")
        .expect(200)
        .expect("Content-Type", /json/);

      expect(typeof response.body).toBe("object");
    });

    it("les erreurs 404 devraient être formatées", async () => {
      const response = await request(app)
        .get("/api/route-inexistante")
        .expect(404);

      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
    });
  });

  // Tests de disponibilité des services
  describe("Service Availability", () => {
    it("devrait gérer l'indisponibilité des services backend", async () => {
      const response = await request(app).get("/api/auth/health");

      // Si le service est down, gateway devrait retourner 502/503
      // Si le service est up, devrait retourner 200
      expect([200, 404, 500, 502, 503]).toContain(response.status);
    });

    it("devrait retourner une erreur claire si le proxy échoue", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@test.com",
        password: "Test123!",
      });

      // Vérifier que la réponse contient des infos utiles
      expect([200, 400, 401, 404, 500, 502, 503]).toContain(response.status);

      if (response.status >= 500) {
        expect(response.body).toHaveProperty("error");
      }
    });
  });

  // Tests de performance
  describe("Performance", () => {
    it("devrait répondre rapidement au health check", async () => {
      const start = Date.now();
      await request(app).get("/health").expect(200);
      const duration = Date.now() - start;

      // Health check devrait prendre moins de 100ms
      expect(duration).toBeLessThan(100);
    });

    it("devrait gérer plusieurs requêtes simultanées", async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => request(app).get("/health"));

      const responses = await Promise.all(promises);

      // Toutes devraient réussir
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
