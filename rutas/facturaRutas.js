const express = require('express');
const router = express.Router();
const facturaController = require('../mongoConexion/mongoController');

// Ruta para crear un nuevo producto
router.post('/facturas', async (req, res) => {
    try {
        const {forma_pago, numero_folio, serie, rfc, producto_key} = req.body;
        const newFactura = await facturaController.createFactura(forma_pago, numero_folio, serie, rfc, producto_key);
        // Si la creación de la factura fue exitosa, responder con el nuevo producto
        res.status(201).json(newFactura);
    } catch (error) {
        console.error("Error al insertar una factura en la base de datos:", error.message);
        res.status(500).json({ error: error.message });
    }
});
// Ruta para obtener todas las facturas
router.get('/facturas', async (req, res) => {
    try {
        const facturas = await facturaController.getFacturas();
        res.json(facturas);
    } catch (error) {
        console.error("Error al obtener facturas en la base de datos:", error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get('/facturas/:numero_folio', async (req, res) => {
    const numero = req.params.numero_folio
    const folio = parseInt(numero.substring(14));
    try {

        const num_folio = await facturaController.buscarFacturaPorNM(folio); 
        res.json(num_folio); 
    } catch (error) {
        console.error("Error al obtener el numero de folio: ", error);
        res.status(500).json({ error: "Error al obtener el numero de folio" });
    }
});


module.exports = router;