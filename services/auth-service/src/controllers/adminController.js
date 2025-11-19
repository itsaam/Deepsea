const userService = require('../services/userService');

async function getAllUsers(req, res) {
  try {
    const users = await userService.getAllUsers();
    return res.json({ users });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteUser(req, res) {
  try {
    const { userId } = req.params;
    await userService.deleteUser(userId);
    return res.status(204).send();
  } catch (err) {
    console.error('Delete user error:', err);
    if (err.message === 'User not found') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const updatedUser = await userService.updateUserRole(userId, role);
    return res.json({ user: updatedUser });
  } catch (err) {
    console.error('Update user role error:', err);
    if (err.message === 'User not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('Invalid')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getAllUsers,
  deleteUser,
  updateUserRole
};