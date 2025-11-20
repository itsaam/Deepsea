const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'DEV_SECRET_CHANGE_ME';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function signToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  signToken,
  verifyToken
};
