const prisma = require("../../prismaClient");
const { hashPassword, comparePassword } = require("../utils/hashUtils");
const { signToken } = require("../config/jwt");

/**
 * Calcule la force d'un mot de passe (identique au frontend)
 * @param {string} pwd - Mot de passe à évaluer
 * @returns {number} Score de force (0-5)
 */
function calculatePasswordStrength(pwd) {
  let strength = 0;
  if (pwd.length >= 8) strength++;
  if (pwd.length >= 12) strength++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
  if (/\d/.test(pwd)) strength++;
  if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
  return strength;
}

/**
 * Valide la force du mot de passe
 * @param {string} password - Mot de passe à valider
 * @throws {Error} Si le mot de passe est trop faible
 */
function validatePasswordStrength(password) {
  if (password.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères");
  }

  const strength = calculatePasswordStrength(password);

  // Exiger au minimum un score de 2/5 (8+ chars + 1 autre critère)
  if (strength < 2) {
    throw new Error(
      "Le mot de passe est trop faible. Il doit contenir au moins 8 caractères et respecter au moins un des critères suivants : majuscules + minuscules, chiffres, ou caractères spéciaux"
    );
  }
}

async function register({ email, username, password, role }) {
  if (!email || !username || !password) {
    throw new Error("email, username and password are required");
  }

  // 🔒 Validation de la force du mot de passe
  validatePasswordStrength(password);

  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new Error("Email already in use");
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    throw new Error("Username already in use");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: passwordHash,
      role: role === "ADMIN" ? "ADMIN" : role === "EXPERT" ? "EXPERT" : "USER",
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      reputation: true,
      createdAt: true,
    },
  });

  const token = signToken(user);

  return { user, token };
}

async function login(identifier, password) {
  if (!identifier || !password) {
    throw new Error("identifier and password are required");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      role: true,
      reputation: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("Invalid identifier or password");
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid identifier or password");
  }

  // Générer et envoyer le code A2F
  const {
    generateTwoFactorCode,
    sendTwoFactorEmail,
  } = require("./emailService");
  const code = generateTwoFactorCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Stocker le code dans la DB
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorCode: code,
      twoFactorExpires: expiresAt,
    },
  });

  // Envoyer l'email
  const emailResult = await sendTwoFactorEmail(user.email, code);
  if (!emailResult.success) {
    throw new Error("Failed to send verification email");
  }

  return {
    message: "Code de vérification envoyé à votre email",
    userId: user.id,
    requiresTwoFactor: true,
  };
}

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      reputation: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

async function verify2FA(userId, code) {
  if (!userId || !code) {
    throw new Error("userId and code are required");
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      reputation: true,
      twoFactorCode: true,
      twoFactorExpires: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.twoFactorCode || !user.twoFactorExpires) {
    throw new Error("No verification code found");
  }

  if (new Date() > user.twoFactorExpires) {
    throw new Error("Code expired");
  }

  if (user.twoFactorCode !== code) {
    throw new Error("Invalid code");
  }

  // Code valide - effacer le code et générer le token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorCode: null,
      twoFactorExpires: null,
    },
  });

  const {
    twoFactorCode: _,
    twoFactorExpires: __,
    ...userWithoutSensitive
  } = user;
  const token = signToken(userWithoutSensitive);

  return { user: userWithoutSensitive, token };
}

async function verifyCredentials(identifier, password) {
  if (!identifier || !password) {
    throw new Error("identifier and password are required");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
    select: {
      id: true,
      email: true,
      username: true,
      password: true,
      role: true,
      reputation: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

async function refreshToken(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      reputation: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const token = signToken(user);
  return { user, token };
}

async function forgotPassword(email) {
  if (!email) {
    throw new Error("Email is required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("No account found with this email");
  }

  const {
    generateResetToken,
    sendResetPasswordEmail,
  } = require("./emailService");
  const resetToken = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expiresAt,
    },
  });

  const emailResult = await sendResetPasswordEmail(user.email, resetToken);
  if (!emailResult.success) {
    throw new Error("Failed to send reset email");
  }

  return { message: "Email de réinitialisation envoyé" };
}

async function resetPassword(token, newPassword) {
  if (!token || !newPassword) {
    throw new Error("Token and new password are required");
  }

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error("Token invalide ou expiré");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return { message: "Mot de passe réinitialisé avec succès" };
}

module.exports = {
  register,
  login,
  verify2FA,
  verifyCredentials,
  refreshToken,
  getUserById,
  forgotPassword,
  resetPassword,
};
