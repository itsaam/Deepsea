createObservation(req, res) {
    (
        async () => {
            try {
                const observationData = req.body
                const newObservation = await observationService.createObservation(observationData)
                res.status(201).json(newObservation)
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la création de l'observation", details: error.message })
            }
        })()
}

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
}

validateObservation(req, res) {
    (
        async () => {
            try {
                const observationId = req.params.observationId
                const validatedObservation = await observationService.validateObservation(observationId)
                res.status(200).json(validatedObservation)
            } catch (error) {
                res.status(500).json({ error: "Erreur lors de la validation de l'observation", details: error.message })
            }
        })()
}

rejectObersvation(req, res) {
    (
        async () => {
            try {
                const observationId = req.params.observationId
                const rejectedObservation = await observationService.rejectObservation(observationId)
                res.status(200).json(rejectedObservation)
            } catch (error) {
                res.status(500).json({ error: "Erreur lors du rejet de l'observation", details: error.message })
            }
        })()
}