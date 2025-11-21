require('dotenv').config();
const express = require('express');
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const taxonomyRoutes = require('./routes/taxonomyRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/taxonomy', taxonomyRoutes);
app.use('/admin', adminRoutes);
app.use('/expert', adminRoutes);

app.get('/health', (req, res) => {
    res.json({status: 'ok', service: 'taxonomy-service'});
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: 'Internal server error', details: err.message});
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
        console.log(`🔬 Taxonomy Service listening on port ${PORT}`);
    });
}

