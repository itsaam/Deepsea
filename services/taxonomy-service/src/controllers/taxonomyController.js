const axios = require('axios');

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\sàâéèê]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const STOP_WORDS = new Set([
  'le','la','les','de','des','du','et','un','une','a','dans','pour','par',
  'the','of','in','on','with','and','is','are','was','were','to','from'
]);

async function getStats(req, res) {
  try {
    const base = process.env.OBSERVATION_SERVICE_URL || 'http://localhost:4001';
    const headers = req.headers.authorization ? { Authorization: req.headers.authorization } : {};

    const [speciesResp, obsResp] = await Promise.all([
      axios.get(`${base}/species`, { headers }),
      axios.get(`${base}/observations`, { headers })
    ]);

    const species = Array.isArray(speciesResp.data) ? speciesResp.data : (speciesResp.data.data || []);
    const observations = Array.isArray(obsResp.data) ? obsResp.data : (obsResp.data.data || []);

    const occurrences = {};
    observations.forEach(obs => {
      if (obs.deleted) return;
      const sid = obs.speciesId;
      occurrences[sid] = (occurrences[sid] || 0) + 1;
    });

    const totalObservations = Object.values(occurrences).reduce((a, b) => a + b, 0);

    const avgPerSpecies = species.length ? (totalObservations / species.length).toFixed(2) : 0;

    const keywordCount = {};
    observations.forEach(obs => {
      if (!obs.description || obs.deleted) return;
      tokenize(obs.description).forEach(token => {
        if (STOP_WORDS.has(token) || token.length < 3) return;
        keywordCount[token] = (keywordCount[token] || 0) + 1;
      });
    });

    const keywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));

    const classification = buildClassification(species, occurrences);

    return res.json({
      summary: {
        totalSpecies: species.length,
        totalObservations,
        averageObservationsPerSpecies: parseFloat(avgPerSpecies)
      },
      occurrencesBySpecies: occurrences,
      keywords,
      classification
    });
  } catch (err) {
    console.error('❌ [STATS] Error computing taxonomy stats:', err.message);

    // Déterminer le type d'erreur
    let statusCode = 500;
    let errorMessage = 'Failed to compute taxonomy stats';
    let errorDetails = err.message;
    let helpMessage = '';

    if (err.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'observation-service is not running';
      errorDetails = `Cannot connect to ${process.env.OBSERVATION_SERVICE_URL || 'http://localhost:3002'}`;
      helpMessage = 'Please start observation-service: cd services/observation-service && npm run dev';
    } else if (err.response?.status === 404) {
      statusCode = 503;
      errorMessage = 'observation-service needs to be restarted';
      errorDetails = 'The endpoint GET /observations was not found. The code has been updated but observation-service needs to be restarted to apply the changes.';
      helpMessage = '⚠️ SOLUTION: Please RESTART observation-service (Ctrl+C then npm run dev)';

      console.error('');
      console.error('╔════════════════════════════════════════════════════════════╗');
      console.error('║  ⚠️  OBSERVATION-SERVICE NEEDS TO BE RESTARTED            ║');
      console.error('╠════════════════════════════════════════════════════════════╣');
      console.error('║  The endpoint GET /observations was added to the code     ║');
      console.error('║  but observation-service is still running the old version ║');
      console.error('║                                                            ║');
      console.error('║  SOLUTION:                                                 ║');
      console.error('║  1. Go to observation-service terminal                    ║');
      console.error('║  2. Press Ctrl+C to stop it                               ║');
      console.error('║  3. Run: npm run dev                                      ║');
      console.error('╚════════════════════════════════════════════════════════════╝');
      console.error('');
    } else if (err.response) {
      statusCode = err.response.status || 500;
      errorMessage = 'Error from observation-service';
      errorDetails = err.response.data?.error || err.message;
    }

    return res.status(statusCode).json({
      error: errorMessage,
      details: errorDetails,
      help: helpMessage || undefined,
      service: 'taxonomy-service'
    });
  }
}

function buildClassification(species, occurrences) {
  const families = {};

  species.forEach(sp => {
    const name = (sp.name || '').trim();
    const tokens = name.split(/\s+/);

    const familyName = tokens[0] || 'Unknown';

    const branch = name[0] ? name[0].toUpperCase() : 'X';

    if (!families[familyName]) {
      families[familyName] = {
        family: familyName,
        branches: {},
        species: []
      };
    }

    const subspecies = tokens.length >= 3 ? tokens.slice(2).join(' ') : null;

    const speciesEntry = {
      id: sp.id,
      name: sp.name,
      scientificName: sp.scientificName || sp.name,
      observations: occurrences[sp.id] || 0,
      subspecies
    };

    families[familyName].species.push(speciesEntry);

    if (!families[familyName].branches[branch]) {
      families[familyName].branches[branch] = [];
    }
    families[familyName].branches[branch].push(speciesEntry);
  });

  return Object.values(families).map(fam => ({
    family: fam.family,
    speciesCount: fam.species.length,
    totalObservations: fam.species.reduce((sum, sp) => sum + sp.observations, 0),
    branches: Object.entries(fam.branches).map(([branchName, branchSpecies]) => ({
      branch: branchName,
      species: branchSpecies.sort((a, b) => b.observations - a.observations)
    })),
    species: fam.species.sort((a, b) => b.observations - a.observations)
  })).sort((a, b) => b.totalObservations - a.totalObservations);
}

module.exports = { getStats };

