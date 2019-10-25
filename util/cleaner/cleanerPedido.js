'use strict';
const BASE = global.BASE;
// const L = global.logger;
// const config = global.config;

const clean = require(BASE + 'util/cleaner/cleaner');


// CAMPO
const DEFINICION_CAMPOS_CABECERA = {
    // Campos que al ser obligatorios se verifican en la creacion del objeto y por tanto ignoramos
    codigoCliente: { ignore: true },
    numeroPedidoOrigen: { ignore: true },
    lineas: { ignore: true },
    login: { ignore: true },
    crc: { ignore: true },
    sap_url_confirmacion: { ignore: true },

    // Campos que son de solo salida, es decir, no deberían aparecer en las peticiones
    numeroPedido: { remove: true },
    alertas: { remove: true },
    empresaFacturadora: { remove: true },
    fechaPedido: { remove: true },
    
    // Campos que de aparecer deben ser cadenas de texto
    direccionEnvio: { string: { max: 50} },
    tipoPedido: { string: { max: 6 } },
    observaciones: { string: { max: 50 } },
    codigoAlmacenServicio: { string: { max: 4 } },

    // Campos que de aparecer deben ser enteros
    aplazamiento: { integer: { min: 1 } },

    // Campos que de aparecer deben estar en formato DateTime
    fechaServicio: { datetime: {} },

    // Campos que deben ser objetos
    notificaciones: { object: true },

    // Campos que deben ser array
    incidencias: { array: {} }
};

const DEFINICION_CAMPOS_LINEAS = {
    // Campos que al ser obligatorios se verifican en la creacion del objeto y por tanto ignoramos
    
    codigoArticulo: { ignore: true },
    
    sap_ignore: { ignore: true },
    

    // Campos que son de solo salida, es decir, no deberían aparecer en las peticiones
    descripcionArticulo: { remove: true },
    codigoArticuloSustituyente: { remove: true },
    cantidadFalta: { remove: true },
    cantidadBonificacionFalta: { remove: true },
    precio: { remove: true },
    descuentoPorcentaje: { remove: true },
    descuentoImporte: { remove: true },
    cargoPorcentaje: { remove: true },
    cargoImporte: { remove: true },
    codigoAlmacenServicio: { remove: true },
    estadoServicio: { remove: true },
    servicioAplazado: { remove: true },

    // Campos que de aparecer deben ser cadenas de texto
    codigoArticulo: { string: { max: 15 } },
    codigoUbicacion: { string: { max: 50 } },
    valeEstupefaciente: { string: { max: 50 } },
    observaciones: { string: { max: 50 } },
    
    // Campos que de aparecer deben ser enteros
    orden: { integer: { } },
    cantidad: { integer: { } },
    cantidadBonificacion: { integer: { min: 1 } },

    // Campos que de aparecer deben estar en formato DateTime
    fechaLimiteServicio: { datetime: {} },

    // Campos que deben ser objetos
    condicion: { object: {} },

    // Campos que deben ser booleanos
    servicioDemorado: { boolean: {} },

    // Campos que deben ser array
    incidencias: { array: {} }

};


/**
 * Dado un objeto pedido creado a partir de una transmisión, hace comprobaciones
 * de que los campos sean correctos.
 *
 * En caso de encontrar errores, el campo se elimina y se añade una incidencia en el mismo pedido.
 * NOTA: ¡ Se asume que el campo de incidencias viene vacío de entrada tanto a nivel 
 *          de cabecera como de líneas !
 *
 * @param {Pedido} json El objeto pedido a tratar
 */
module.exports = function(pedido) {

    var incidenciasCabecera = clean(pedido, DEFINICION_CAMPOS_CABECERA);
    pedido.lineas.forEach( (lineaPedido) => {
        var incidenciasLinea = clean(lineaPedido, DEFINICION_CAMPOS_LINEAS);
        if (incidenciasLinea.hasError()) {
            if (lineaPedido.incidencias && lineaPedido.incidencias.push) {
                lineaPedido.incidencias.concat(incidenciasLinea.getErrors());
            } else {
                lineaPedido.incidencias = incidenciasLinea.getErrors();
            }
        }
    });

    if (pedido.incidencias && pedido.incidencias.push) {
        pedido.incidencias.concat(incidenciasCabecera.getErrors());
    } else {
        pedido.incidencias = incidenciasCabecera.getErrors();
    }

};
    

