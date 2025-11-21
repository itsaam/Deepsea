const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // ou 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Générer un code à 6 chiffres
const generateTwoFactorCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Envoyer l'email avec le code A2F
const sendTwoFactorEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Code de vérification DeepSea Archives",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🌊 DeepSea Archives</h2>
        <p>Votre code de vérification est :</p>
        <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${code}</h1>
        <p>Ce code expire dans 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error: error.message };
  }
};

// Générer un token de réinitialisation
const generateResetToken = () => {
  return require("crypto").randomBytes(32).toString("hex");
};

// Envoyer l'email de réinitialisation
const sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Réinitialisation de mot de passe - DeepSea Archives",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
        <h2>🌊 DeepSea Archives</h2>
        <img src="https://i.pinimg.com/736x/0f/dd/22/0fdd224bb2cee743b1d0ef20cc285ec9.jpg" alt="Oublié ton mot de passe ?" style="width: 200px; height: 200px; margin: 20px auto; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Réinitialiser mon mot de passe
        </a>
        <p>Ce lien expire dans 1 heure.</p>
        <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <p style="color: #999; font-size: 11px;">Lien : ${resetUrl}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateTwoFactorCode,
  sendTwoFactorEmail,
  generateResetToken,
  sendResetPasswordEmail,
};
