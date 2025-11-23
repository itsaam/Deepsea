/**
 * Tests unitaires pour gestionErreurs.js
 */

const {
  gererErreurController,
  avecGestionErreur,
} = require("../gestionErreurs");

describe("gestionErreurs - gererErreurController()", () => {
  let mockRes;

  beforeEach(() => {
    // Mock de l'objet Response Express
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    // Mock console.error pour éviter le spam dans les tests
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test("devrait retourner 400 pour erreur métier (not found)", () => {
    const error = new Error("User not found");
    gererErreurController(error, mockRes, "test");

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "User not found",
    });
  });

  test("devrait retourner 400 pour erreur métier (invalid)", () => {
    const error = new Error("Email invalid");
    gererErreurController(error, mockRes, "test");

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("devrait retourner 400 pour erreur métier (already in use)", () => {
    const error = new Error("Email already in use");
    gererErreurController(error, mockRes, "test");

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  test("devrait retourner 500 pour erreur serveur générique", () => {
    const error = new Error("Database connection failed");
    gererErreurController(error, mockRes, "test");

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Erreur interne du serveur",
    });
  });

  test("devrait logger le contexte de l'erreur", () => {
    const error = new Error("Test error");
    gererErreurController(error, mockRes, "inscription");

    expect(console.error).toHaveBeenCalledWith("Erreur inscription:", error);
  });
});

describe("gestionErreurs - avecGestionErreur()", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test("devrait exécuter une fonction async avec succès", async () => {
    const mockFunction = jest.fn().mockResolvedValue(undefined);
    const wrappedFunction = avecGestionErreur(mockFunction, "test");

    await wrappedFunction(mockReq, mockRes, mockNext);

    expect(mockFunction).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  test("devrait gérer les erreurs automatiquement", async () => {
    const mockFunction = jest
      .fn()
      .mockRejectedValue(new Error("User not found"));
    const wrappedFunction = avecGestionErreur(mockFunction, "test");

    await wrappedFunction(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  test("devrait utiliser le contexte fourni", async () => {
    const mockFunction = jest.fn().mockRejectedValue(new Error("Test error"));
    const wrappedFunction = avecGestionErreur(mockFunction, "inscription");

    await wrappedFunction(mockReq, mockRes, mockNext);

    expect(console.error).toHaveBeenCalledWith(
      "Erreur inscription:",
      expect.any(Error)
    );
  });
});
