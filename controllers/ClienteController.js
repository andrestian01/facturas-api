const cl = require('../Models/Clientes');

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://userdev:jgrJeunVI1XokTYL@cluster0.sktd1na.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let clientes = [
    { id: 1, nombre_legal: '', id_impuestos: '', sistema_impuestos: '', email: '', codigoPostal: '', calle: '', numero: '', direccion: ''},
    { id: 2, nombre_legal: '', id_impuestos: '', sistema_impuestos: '', email: '', codigoPostal: '', calle: '', numero: '', direccion: ''}
];

const rfiscales = {
    "601": "General de Ley Personas Morales",
    "603": "Personas Morales con Fines no Lucrativos",
    "605": "Sueldos y Salarios e Ingresos Asimilados a Salarios",
    "606": "Arrendamiento",
    "608": "Demás ingresos",
    "609": "Consolidación",
    "610": "Residentes en el Extranjero sin Establecimiento Permanente en México",
    "611": "Ingresos por Dividendos (socios y accionistas)",
    "612": "Personas Físicas con Actividades Empresariales y Profesionales",
    "614": "Ingresos por intereses",
    "616": "Sin obligaciones fiscales",
    "620": "Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
    "621": "Incorporación Fiscal",
    "622": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
    "623": "Opcional para Grupos de Sociedades",
    "624": "Coordinados",
    "628": "Hidrocarburos",
    "607": "Régimen de Enajenación o Adquisición de Bienes",
    "629": "De los Regímenes Fiscales Preferentes y de las Empresas Multinacionales",
    "630": "Enajenación de acciones en bolsa de valores",
    "615": "Régimen de los ingresos por obtención de premios",
    "625": "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
    "626": "Régimen Simplificado de Confianza",

};


async function getEstadoPorCodigoPostal(codigoPostal) {
    try {
        const response = await fetch(`https://api.zippopotam.us/MX/${codigoPostal}`);
        const data = await response.json();

        if (response.ok) {
            const estado = data.places && data.places.length > 0 ? data.places[0].state : "Código postal inválido";
            return estado;
        } else {

            throw new Error(`Código postal inválido`);
        }
    } catch (error) {
        return { error: error.message };
    }
}

function validarRegimen(codigoRF) {
    const codigoI = parseInt(codigoRF.toString());

    if (!rfiscales[codigoI.toString()]) {
        throw new error ("Regimen fiscal inexistente");
    }
    for (const code in rfiscales) {
        if (code == codigoI) {
            return rfiscales[code];
        }
    }
    return "Regimen fiscal no encontrado";
}

function validarRegimenRF(codigoRF) {

    const codigoI = parseInt(codigoRF.toString());
    

    if (!rfiscales[codigoI.toString()]) {
        throw new error ("Regimen fiscal inexistente");
    }
    return codigoI.toString();

}

async function getInfoCP(zipCode, colonia) {
    try {
        const response = await fetch(`https://api.zippopotam.us/MX/${zipCode}`);
        const data = await response.json();
        if (response.ok) {
            const colonias = data.places.map(place => place['place name']);

            const coloniaLowerCase = colonia.toLowerCase();
            const coloniasLowerCase = colonias.map(col => col.toLowerCase());
  
            const estado = data.places[0].state;
  

            const index = coloniasLowerCase.indexOf(coloniaLowerCase);
            if (index !== -1) {
                return colonias[index]; 
            } else {
                throw new Error(`La colonia no está presente en el código postal.`);
            }
        } else {
            throw new Error(`Error al obtener los datos: ${data.message}`);
        }
    } catch (error) {
        return { error: error.message };
    }
}
  
async function buscarClientes(rfc) {
    try {
        await client.connect(); 
        const db = client.db('Clientes');
        const collection = db.collection('clientes_data'); // Seleccionar la colección
  
        // Especificar los campos que deseas recuperar
        const projection = {
            _id: 0, // Excluir el campo _id
            Nombre_Legal: 1,
            RFC: 1,
            Regimen_Fiscal: 1
        };
  
        // Construir el filtro de búsqueda
        const filtro = { RFC: rfc };

        const clientes = await collection.find(filtro, projection).toArray();

        return clientes;
    } catch (error) {
        console.error('Error en la búsqueda de clientes por RFC:', error);
        throw error;
    }
}

async function getProductByKey(producto_key) {
    try {
        const collection = client.db("Productos").collection("productos_data");
        return await collection.findOne({ producto_key });
    } catch (error) {
        console.error("Error 400: Error al obtener el producto por producto_key:", error);
        throw error;
    }
}

async function productoExistente(producto_key, descripcion, sku) {
    try {
        await client.connect();
        const collection = client.db("Productos").collection("productos_data");
        return await collection.findOne({ 
            $or: [
                { producto_key: producto_key },
                { descripcion: descripcion },
                { sku: sku }
            ]
        });
    } catch (error) {
        console.error("Error 400: Error al obtener el producto por clave, descripción o SKU:", error);
        throw error;
    }
}

async function getFacturaNum(numero_folio,) {
    try {
        const collection = client.db("Factura").collection("factura_data");
        return await collection.findOne({ numero_folio });
    } catch (error) {
        console.error("Error 400: Error al obtener el numero de folio:", error);
        throw error;
    }
}

async function getFacturaSerie(serie) {
    try {
        const collection = client.db("Factura").collection("factura_data");
        return await collection.findOne({ serie });
    } catch (error) {
        console.error("Error 400: Error al obtener la serie:", error);
        throw error;
    }
}

async function existeCliente(rfc) {
    try {
        await client.connect(); // Conectar a la base de datos
        const db = client.db('Clientes'); // Seleccionar la base de datos
        const collection = db.collection('Clientes'); 
  
        const projection = {
            id_impuestos: 1
        };
        const filtro = { id_impuestos: rfc };
        const clientes = await collection.find(filtro, projection).toArray();
        return clientes;
    } catch (error) {
        console.error('Error en la búsqueda de clientes por RFC:', error);
        throw error;
    }
}





module.exports = {
    getEstadoPorCodigoPostal,
    validarRegimen,
    getInfoCP,
    buscarClientes,
    getProductByKey,
    productoExistente,
    getFacturaNum,
    getFacturaSerie,
    existeCliente,
    validarRegimenRF
}