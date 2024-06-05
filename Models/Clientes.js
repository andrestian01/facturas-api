

module.exports = class Clientes {
    constructor(id, nombre_legal, id_impuestos, sistema_impuestos, email, codigoPostal, calle, numero, colonia, direccion ) {
            this.id = id;
            this.nombre_legal = nombre_legal;
            this.id_impuestos = id_impuestos;
            this.sistema_impuestos = sistema_impuestos;
            this.email = email;
            this.codigoPostal = codigoPostal;
            this.calle = calle;
            this.colonia = colonia;
            this.numero = numero;
            this.direccion = `${direccion.asentamiento[0]}, ${direccion.tipo_asentamiento}, ${direccion.municipio}, ${direccion.estado}, ${direccion.pais}`;
            
        }
};
