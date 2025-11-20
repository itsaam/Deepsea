const axios = require('axios');
const prisma = require('../../prismaClient');

async function getUserHistory(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const events = await prisma.audit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      userId,
      totalEvents: events.length,
      history: events
    });
  } catch (err) {
    console.error('Error fetching user history:', err.message);
    res.status(500).json({ error: 'Failed to fetch user history', details: err.message });
  }
}

async function getSpeciesHistory(req, res) {
  try {
    const speciesId = parseInt(req.params.id, 10);
    if (isNaN(speciesId)) {
      return res.status(400).json({ error: 'Invalid species id' });
    }

    const events = await prisma.audit.findMany({
      where: { speciesId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      speciesId,
      totalEvents: events.length,
      history: events
    });
  } catch (err) {
    console.error('Error fetching species history:', err.message);
    res.status(500).json({ error: 'Failed to fetch species history', details: err.message });
  }
}

async function softDeleteObservation(req, res) {
  try {
    const obsId = parseInt(req.params.id, 10);
    if (isNaN(obsId)) {
      return res.status(400).json({ error: 'Invalid observation id' });
    }

    const base = process.env.OBSERVATION_SERVICE_URL || 'http://localhost:4001';
    const headers = req.headers.authorization ? { Authorization: req.headers.authorization } : {};

    const resp = await axios.patch(`${base}/observations/${obsId}/soft-delete`, {}, { headers });
    const observation = resp.data;

    await prisma.audit.create({
      data: {
        type: 'DELETE',
        observationId: obsId,
        userId: req.user.id || null,
        speciesId: observation.speciesId || null,
        details: JSON.stringify({
          action: 'soft_delete',
          performedBy: req.user.email || req.user.username,
          role: req.user.role,
          timestamp: new Date().toISOString()
        })
      }
    });

    res.json({
      success: true,
      message: 'Observation supprimée logiquement',
      observation
    });
  } catch (err) {
    console.error('Error soft deleting observation:', err.message);
    res.status(500).json({ error: 'Soft delete failed', details: err.message });
  }
}

async function restoreObservation(req, res) {
  try {
    const obsId = parseInt(req.params.id, 10);
    if (isNaN(obsId)) {
      return res.status(400).json({ error: 'Invalid observation id' });
    }

    const base = process.env.OBSERVATION_SERVICE_URL || 'http://localhost:4001';
    const headers = req.headers.authorization ? { Authorization: req.headers.authorization } : {};

    const resp = await axios.patch(`${base}/observations/${obsId}/restore`, {}, { headers });
    const observation = resp.data;

    await prisma.audit.create({
      data: {
        type: 'RESTORE',
        observationId: obsId,
        userId: req.user.id || null,
        speciesId: observation.speciesId || null,
        details: JSON.stringify({
          action: 'restore',
          performedBy: req.user.email || req.user.username,
          role: req.user.role,
          timestamp: new Date().toISOString()
        })
      }
    });

    res.json({
      success: true,
      message: 'Observation restaurée',
      observation
    });
  } catch (err) {
    console.error('Error restoring observation:', err.message);
    res.status(500).json({ error: 'Restore failed', details: err.message });
  }
}

module.exports = {
  getUserHistory,
  getSpeciesHistory,
  softDeleteObservation,
  restoreObservation
};

