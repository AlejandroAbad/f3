'use strict';
const BASE = global.BASE;
//const C = global.config;
const L = global.logger;
const K = global.constants;

// Interfaces
const iMongo = require(BASE + 'interfaces/imongo/iMongo');
const iFlags = require(BASE + 'interfaces/iFlags');

// Modelos
const ObjectID = iMongo.ObjectID;
const ConfirmacionPedidoSAP = require(BASE + 'model/pedido/ModeloConfirmacionPedidoSAP');



module.exports.retransmitirPedido = (txIdRetransmision, dbTx, opcionesRetransmision, estadoRetransmision, mensajeError, resultadoRetransmision) => {

	L.xd(txIdRetransmision, ['Emitiendo evento retransmitirPedido']);

	let txIdOriginal = dbTx._id;
	let estadoOriginal = dbTx.status;
	let estadoNuevo = resultadoRetransmision && resultadoRetransmision.status ? resultadoRetransmision.status : null;

	let datosRetransmitidos = {
		_id: txIdRetransmision,
		timestamp: new Date(),
		status: estadoRetransmision,
		options: opcionesRetransmision
	}
	if (mensajeError) datosRetransmitidos.errorMessage = mensajeError;
	if (opcionesRetransmision.ctxId) datosRetransmitidos.cloned = true;
	if (!opcionesRetransmision.ctxId && resultadoRetransmision) datosRetransmitidos.newValues = resultadoRetransmision;

	let transaccionDeActualizacion = {
		$setOnInsert: {
			_id: txIdOriginal
		},
		$push: {
			retransmissions: datosRetransmitidos
		}
	}


	if (opcionesRetransmision.ctxId) {
		// La retransmisión ha generado un clon.
		module.exports.finClonarPedido(txIdOriginal, opcionesRetransmision.ctxId, resultadoRetransmision)
		iFlags.set(txIdOriginal, K.FLAGS.CLONADO);
	}
	else if (!opcionesRetransmision.noActualizarOriginal && resultadoRetransmision) {
		// ¿Debemos actualizar la transmisión original?
		let [actualizar, advertencia] = _actualizarTransmisionOriginal(estadoOriginal, estadoNuevo);
		if (actualizar) {
			transaccionDeActualizacion['$set'] = { modifiedAt: new Date() };
			datosRetransmitidos.oldValues = {};

			for (let campo in resultadoRetransmision) {
				transaccionDeActualizacion['$set'][campo] = resultadoRetransmision[campo];
				datosRetransmitidos.oldValues[campo] = dbTx[campo];
			}

			if (advertencia) {
				iFlags.set(txIdOriginal, K.FLAGS.RETRANSMISION_UPDATE_WARN);
				L.xw(txIdOriginal, ['** ADVERTENCIA: La respuesta del pedido que se dió a la farmacia ha cambiado']);
			} else {
				iFlags.set(txIdOriginal, K.FLAGS.RETRANSMISION_UPDATE);
			}
		} else {
			// Si se habían establecido flags, las borramos, pues no queremos actualizar nada
			// mas que añadir el flag de retransmision sin update
			iFlags.del(txIdOriginal);
			iFlags.set(txIdOriginal, K.FLAGS.RETRANSMISION_NO_UPDATE);
		}

	} else {
		iFlags.set(txIdOriginal, K.FLAGS.RETRANSMISION_NO_UPDATE);
	}


	iFlags.finaliza(txIdOriginal, transaccionDeActualizacion);

	iMongo.transaccion.grabar(transaccionDeActualizacion);
	L.xi(txIdOriginal, ['Emitiendo COMMIT para evento Retransmision'], 'txCommit');
	L.yell(txIdOriginal, K.TX_TYPES.RETRANSMISION_PEDIDO, estadoNuevo, [resultadoRetransmision]);
}

/**
 * Esta funcion nos ayuda a decidir si la retransmisión debe actualizar la transmisión original.
 * Se basa en la tabla definida en el manual:
 * 		https://fedicom3-app.hefame.es/documentacion/manual/retransmit
 * @param {number} estadoOriginal El estado original de la transmisión
 * @param {number} estadoNuevo El estado resultante de la retransmisión
 */
const _actualizarTransmisionOriginal = (estadoOriginal, estadoNuevo) => {
	if (!estadoNuevo) return [false, false];
	if (!estadoOriginal) return [true, false];

	// Los estados RECEPCIONADO, ESPERANDO_INCIDENCIAS o INCIDENCIAS_RECIBIDAS siempre se actualizan.
	switch (estadoOriginal) {
		case K.TX_STATUS.RECEPCIONADO:
		case K.TX_STATUS.ESPERANDO_INCIDENCIAS:
		case K.TX_STATUS.INCIDENCIAS_RECIBIDAS:
			return [true, false];
	}

	// Si el estado nuevo es NO_SAP, nunca actualizamos
	if (estadoNuevo === K.TX_STATUS.NO_SAP) return [false, false];

	// Si el estado original es OK, solo actualizamos si el nuevo estado tambien lo es
	if (estadoOriginal === K.TX_STATUS.OK) return [estadoNuevo === K.TX_STATUS.OK, false];

	// En el resto de casos, siempre actualizaremos, pero puede que haya que advertir
	switch (estadoNuevo) {
		case K.TX_STATUS.OK:
		case K.TX_STATUS.PEDIDO.ESPERANDO_NUMERO_PEDIDO:
			return [true, false];
	}
	switch (estadoOriginal) {
		case K.TX_STATUS.PETICION_INCORRECTA:
		case K.TX_STATUS.RECHAZADO_SAP:
			return [true, false];
	}
	return [true, (estadoNuevo === K.TX_STATUS.PEDIDO.SIN_NUMERO_PEDIDO_SAP && estadoNuevo === estadoOriginal)];
};


/**
 * Este evento crea la transccion como RECEPCIONADA con el flag 'CLON'
 * La posterior emisión de iEventos.retransmisiones.retransmitirPedido es la que completará
 * el estado de la misma con la respuesta de SAP y la nueva respuesta del cliente.
 */
module.exports.clonarPedido = (reqClonada, pedidoClonado) => {

	let txId = reqClonada.txId;

	let transaccion = {
		$setOnInsert: {
			_id: txId,
			createdAt: new Date()
		},
		$max: {
			modifiedAt: new Date(),
			status: K.TX_STATUS.RECEPCIONADO
		},
		$set: {
			crc: new ObjectID(pedidoClonado.crc),
			authenticatingUser: reqClonada.identificarUsuarioAutenticado(),
			client: reqClonada.identificarClienteSap(),
			iid: global.instanceID,
			type: K.TX_TYPES.PEDIDO,
			clientRequest: {
				authentication: reqClonada.token,
				ip: 'RTX',
				headers: reqClonada.headers,
				body: reqClonada.body
			},
		}
	};

	iFlags.set(txId, K.FLAGS.CLON);
	iFlags.finaliza(txId, transaccion);

	L.xi(reqClonada.txId, ['Emitiendo COMMIT para evento clonarPedido'], 'txCommit');
	iMongo.transaccion.grabar(transaccion);
	L.yell(reqClonada.txId, K.TX_TYPES.PEDIDO, K.TX_STATUS.RECEPCIONADO, [reqClonada.identificarUsuarioAutenticado(), pedidoClonado.crc, reqClonada.body]);
}

module.exports.emitStatusFix = (txId, newStatus) => {

	if (txId) {
		var dataUpdate = {
			$setOnInsert: {
				_id: txId,
				createdAt: new Date()
			},
			$max: {
				status: newStatus,
				modifiedAt: new Date()
			}
		};

		//Flags.set(txId, K.FLAGS.WATCHDOG);
		iFlags.finaliza(txId, dataUpdate);

		L.xi(txId, ['Emitiendo COMMIT para evento StatusFix'], 'txCommit');
		iMongo.transaccion.grabar(dataUpdate);
		L.yell(txId, K.TX_TYPES.ARREGLO_ESTADO, newStatus, ['StatusFix']);
	}
}

module.exports.emitRecoverConfirmacionPedido = (originalTxId, confirmTx) => {

	var confirmacionSap = confirmTx.clientRequest.body;
	var confirmId = confirmTx._id;

	var [estadoTransmision, numerosPedidoSAP] = ConfirmacionPedidoSAP.obtenerEstadoDeConfirmacionSap(confirmacionSap);

	var updateData = {
		$setOnInsert: {
			_id: originalTxId,
			createdAt: new Date()
		},
		$max: {
			modifiedAt: new Date(),
			status: estadoTransmision,
		},
		$set: {
			numerosPedidoSAP: numerosPedidoSAP
		},
		$push: {
			sapConfirms: {
				txId: confirmId,
				timestamp: confirmId.createdAt,
				sapSystem: confirmTx.authenticatingUser
			}
		}
	}

	//Flags.set(originalTxId, K.FLAGS.WATCHDOG);
	iFlags.finaliza(originalTxId, updateData);

	L.xi(originalTxId, ['Emitiendo COMMIT para evento RecoverConfirmacionPedido'], 'txCommit');
	iMongo.transaccion.grabar(updateData);
	L.yell(originalTxId, K.TX_TYPES.RECUPERACION_CONFIRMACION, estadoTransmision, numerosPedidoSAP);

	/**
	 * Dejamos constancia en la propia transmisión de confirmación de que se ha actualizado
	 * Lo normal es que previamente estuviera en estado K.TX_STATUS.CONFIRMACION_PEDIDO.NO_ASOCIADA_A_PEDIDO
	 * y no tenga el valor de 'confirmingId'
	 */
	var commitConfirmacionSap = {
		$setOnInsert: {
			_id: confirmId,
			createdAt: new Date()
		},
		$set: {
			modifiedAt: new Date(),
			status: K.TX_STATUS.OK,
			confirmingId: originalTxId,
		}
	}
	L.xi(confirmId, ['Se ha asociado esta confirmación con el pedido que confirma', originalTxId], 'txCommit');
	iMongo.transaccion.grabar(commitConfirmacionSap);

}
