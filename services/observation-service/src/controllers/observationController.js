const observationService = require('../services/observationService');

const observationController = {
    createObservation(req, res) {
        (
            async () => {
                try {
                    const observationData = req.body
                    const newObservation = await observationService.createObservation(observationData, req.user.id)
                    res.status(201).json(newObservation)
                } catch (error) {
                    res.status(500).json({ error: "Erreur lors de la création de l'observation", details: error.message })
                }
            })()
    },

    getObservationsBySpecies(req, res) {
        (
            async () => {
                try {
                    const speciesId = req.params.speciesId
                    const observations = await observationService.getObservationsBySpecies(speciesId)
                    res.status(200).json(observations)
                } catch (error) {
                    res.status(500).json({ error: "Erreur lors de la récupération des observations", details: error.message })
                }
            })()
    },

    validateObservation(req, res) {
        (
            async () => {
                try {
                    const observationId = req.params.observationId
                    const validatedObservation = await observationService.validateObservation(observationId, req.user.id)
                    res.status(200).json(validatedObservation)
                } catch (error) {
                    res.status(500).json({ error: "Erreur lors de la validation de l'observation", details: error.message })
                }
            })()
    },

    rejectObersvation(req, res) {
        (
            async () => {
                try {
                    const observationId = req.params.observationId
                    const rejectedObservation = await observationService.rejectObservation(observationId, req.user.id)
                    res.status(200).json(rejectedObservation)
                } catch (error) {
                    res.status(500).json({ error: "Erreur lors du rejet de l'observation", details: error.message })
                }
            })()
    },

    softDeleteObservation(req, res) {
        (
            async () => {
                try {
                    const observationId = parseInt(req.params.id, 10)
                    const userId = req.user.id
                    const deletedObservation = await observationService.softDeleteObservation(observationId, userId)
                    res.status(200).json(deletedObservation)
                } catch (error) {
                    res.status(500).json({ error: "Erreur lors de la suppression logique de l'observation", details: error.message })
                }
            })()
    },

    restoreObservation(req, res) {
        (
            async () => {
                try {
                    const observationId = parseInt(req.params.id, 10)
                    const restoredObservation = await observationService.restoreObservation(observationId)
                    res.status(200).json(restoredObservation)
                } catch (error) {
                    res.status(500).json({ error: "Erreur lors de la restauration de l'observation", details: error.message })
                }
            })()
    },

    getAllObservations(req, res) {
        (
            async () => {
                try {
                    const includeDeleted = req.query.includeDeleted === 'true'
                    const observations = await observationService.getAllObservations(includeDeleted)
                    res.status(200).json(observations)
                } catch (error) {
                    res.status(500).json({ error: "Erreur lors de la récupération des observations", details: error.message })
                }
            })()
    }
};

module.exports = observationController;
