const express = require('express');
const bodyParser = require('body-parser');
const todoRoutes = require('./rutas/clientesRutas');
const productosRutas = require('./rutas/productosRutas');
const facturaRutas = require('./rutas/facturaRutas');

const app = express();

app.use(bodyParser.json());

// Rutas
app.use('/api', todoRoutes);
app.use('/api', productosRutas);
app.use('/api', facturaRutas);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});

