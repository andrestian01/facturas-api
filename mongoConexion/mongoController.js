const { MongoClient } = require('mongodb');

const cl = require('../controllers/ClienteController');

const uri = "mongodb+srv://userdev:jgrJeunVI1XokTYL@cluster0.sktd1na.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let clientes = [
    { id: 1, nombre_legal: '', id_impuestos: '', sistema_impuestos: '', email: '', codigoPostal: '', calle: '', numero: '', direccion: ''},
    { id: 2, nombre_legal: '', id_impuestos: '', sistema_impuestos: '', email: '', codigoPostal: '', calle: '', numero: '', direccion: ''}
];


async function main() {
    try {
        // Conectar al servidor de MongoDB
        await client.connect();
        console.log("Conexión exitosa a la base de datos de MongoDB Atlas");

    } catch (e) {
        console.error("Error al conectar a la base de datos de MongoDB Atlas:", e);
    }
}

async function createCliente(nombre_legal, id_impuestos, sistema_impuestos, email, codigoPostal, calle, colonia, numero, direccion) {
    try {
        const lastCliente = clientes[clientes.length - 1];
        const lastId = lastCliente.id;
        // Seleccionar la colección
        const collection = client.db("Clientes").collection("Clientes");

        if (id_impuestos === undefined) {throw new Error("Error 400: No se ha proporcionado el RFC.");}  
        if (sistema_impuestos === undefined) {throw new Error("Error 400: No se ha proporcionado el sistema de impuestos.");} 
        const infoColonia = await cl.getInfoCP(codigoPostal, colonia);
        if (infoColonia.error) {throw new Error("Error 400: La colonia no está presente en el código postal.");}        
        // const clientesExistenConRFC = await cl.buscarClientes(id_impuestos);
        // if (!clientesExistenConRFC || clientesExistenConRFC.length === 0) {throw new Error("Error 404: Cliente no encontrado en la base de datos.");}
        const clienteExistente = await cl.existeCliente(id_impuestos);
        if (clienteExistente) {throw new Error("Error 400: Ya existe un cliente con el mismo RFC en la base de datos clientes.");}

        // Crear un nuevo documento
        const newCliente = {
            id: lastId + 1,
            nombre_legal,
            id_impuestos,
            sistema_impuestos: await cl.validarRegimen(sistema_impuestos),
            email,
            direccion: {
                codigoPostal,
                calle,
                colonia: infoColonia, 
                numero,
                estado: await cl.getEstadoPorCodigoPostal(codigoPostal)
            }
        };

        // Crear un nuevo cliente sin dirección de correo electrónico
        if (newCliente.email === "") delete newCliente.email;
        if (newCliente.id_impuestos === ""){
            throw new Error("Error 400: No se ha añadido el RFC");
        } 

        //Validar regimen fiscal
        const regimenValido = await cl.validarRegimen(sistema_impuestos);
        if (regimenValido === "Regimen fiscal inexistente") {
            throw new Error("Error 400: Regimen fiscal inexistente");
        }

        //Validar Codigo Postal
        const estado = await cl.getEstadoPorCodigoPostal(codigoPostal);
        if (estado === "Código postal inválido") {
            throw new Error("Error 400: Código postal inválido");
        }

        const RFC = await buscarClientePorRFC(id_impuestos);
        if (estado === "Error 400: No se encontró al cliente en la base de datos.") {
            throw new Error("Error 400: No se encontró al cliente en la base de datos.");
        }
        //Agrega clientes en la base de datos de mongo
        clientes.push(newCliente);
        const result = await collection.insertOne(newCliente);
        console.log(`(201) Cliente agregado con éxito`);
        return newCliente;
    } catch (error) {
        console.error("Error 400: Error al insertar cliente en la base de datos:", error);
        throw error;
    }
}

async function getClientes() {
    try {
        const db = client.db('Clientes');
        const collection = db.collection('Clientes');

        const clientes = await collection.find().toArray();
        return clientes;
    } catch (error) {
        console.error("Error 400: Error al obtener clientes de la base de datos:", error);
        throw error;
    }
}

async function createProducto(producto_key, descripcion, precio, sku, impuestos, impuestos_locales) {
    try {
        // Verificar si se proporcionó el producto_key
        if (!producto_key) {
            throw new Error("Error 400: No se proporcionó el producto_key.");
        }
        //Verificar si existe el producto
        const productoExistente = await cl.productoExistente(producto_key, descripcion, sku);
        if (productoExistente) {
            throw new Error("Error 400: El producto ya está registrado en la base de datos.");
        }

       
        // Si todo está bien, proceder con la inserción del producto
        await client.connect();
        const collection = client.db("Productos").collection("productos_data");

        const newProducto = {
            producto_key,
            descripcion,
            precio,
            sku,
            impuestos,
            impuestos_locales
        };

        await collection.insertOne(newProducto);
        return newProducto;
    } catch (error) {
        console.error("Error 400: Error al insertar producto en la base de datos:", error);
        throw error;
    } finally {
        await client.close();
    }
}



async function getProductos() {
    try {
        const db = client.db('Productos');
        const collection = db.collection('productos_data');

        const clientes = await collection.find().toArray();
        return clientes;
    } catch (error) {
        console.error("Error 400: Error al obtener los productos:", error);
        throw error;
    }
}


async function createFactura(forma_pago, numero_folio, serie, rfc, producto_key) {
    try {
        await client.connect();
        const collection = client.db("Factura").collection("factura_data");
        //Verificar si existe el cliente
        const clientExiste = await buscarClientePorRFC(rfc);
        if (!clientExiste) {throw new Error("Error 400: El cliente no se encuentra registrado en la base de datos.");}
        //Verificar si existe el producto
        const productoExiste = await cl.getProductByKey(producto_key);
        if (!productoExiste) {throw new Error("Error 400: El producto no se encuentra registrado en la base de datos.");}
        //Verificar si el numero de folio (factura) existe
        const facturaExiste = await cl.getFacturaNum(numero_folio);
        if (facturaExiste) {throw new Error("Error 400: La factura ya se encuentra registrado en la base de datos.");}
        //Verificar si la serie existe en una factura
        const serieExiste = await cl.getFacturaSerie(serie);
        if (serieExiste) {
            throw new Error("Error 400: La serie ya se encuentra registrado en una factur.");
        }

        const newFactura = {
            forma_pago,
            numero_folio,
            serie,
            rfc,
            producto_key
        };

        await collection.insertOne(newFactura);
        return newFactura;
    } catch (error) {
       // throw new Error("Error 400: Error al insertar una factura en la base de datos:", error);
        throw error;
    }
}
async function getFacturas() {
    try {
        const collection = client.db("Factura").collection("factura_data");
        const facturas = await collection.find().toArray();
        return facturas;
    } catch (error) {
        console.error("Error 400: Error al obtener facturas de la base de datos:", error);
        throw error;
    }
}

async function buscarClientePorRFC(rfc) {
    try {
        await client.connect();
        const collection = client.db("Clientes").collection("Clientes");
        return await collection.findOne({ id_impuestos: rfc });
    } catch (error) {
        console.error("Error al obtener el cliente por RFC:", error);
        throw error;
    }
}

async function buscarProductoPorPK(pk) {
    try {
        await client.connect();
        const collection = client.db("Productos").collection("productos_data");
        return await collection.findOne({ producto_key : pk});
    } catch (error) {
        console.error("Error al obtener el producto por Product Key:", error);
        throw error;
    } 
}

async function buscarFacturaPorNM(nm) {
    try {
        await client.connect();
        const collection = client.db("Factura").collection("factura_data");
        return await collection.findOne({ numero_folio : nm});
    } catch (error) {
        console.error("Error al obtener la factura por numero de folio :", error);
        throw error;
    } 
}

async function createClienteSAT(nombre_legal, RFC, Regimen_Fiscal) {
    try {
        await client.connect();
        const collection = client.db("Clientes").collection("clientes_data");
        
        // Verificar si el cliente ya existe en la base de datos
        const existingCliente = await collection.findOne({ RFC });
        if (existingCliente) {
            throw new Error('Error 400: El cliente ya está registrado.');
        }

        //Validar regimen fiscal y obtener solo el número
        const regimenNumero = await cl.validarRegimenRF(Regimen_Fiscal);
        if (regimenNumero === "Regimen fiscal inexistente") {
            throw new Error("Error 400: Regimen fiscal inexistente");
        }

        // Crear un nuevo cliente con el número de régimen fiscal
        const newCliente = {
            nombre_legal,
            RFC,
            Regimen_Fiscal: regimenNumero,
        };

        // Insertar el nuevo cliente en la colección
        const result = await collection.insertOne(newCliente);

        console.log(`(201) Cliente agregado con éxito`);
        return newCliente;
    } catch (error) {
        console.error("Error 400: Error al insertar cliente en la base de datos:", error.message);
        throw error;
    }
}

async function getClientevRFC() {
    try {
        const db = client.db('Clientes');
        const collection = db.collection('clientes_data');

        const clientes = await collection.find().toArray();
        return clientes;
    } catch (error) {
        console.error("Error 400: Error al obtener clientes de la base de datos:", error);
        throw error;
    }
}

main().catch(console.error);
module.exports = {
    createCliente,
    getClientes,
    createProducto,
    getProductos,
    createFactura,
    getFacturas,
    buscarClientePorRFC,
    buscarProductoPorPK,
    buscarFacturaPorNM,
    createClienteSAT,
    getClientevRFC
}