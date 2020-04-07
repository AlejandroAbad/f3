'use strict';
const BASE = global.BASE;
const C = global.config;
const L = global.logger;
const K = global.constants;

const Isap = require(BASE + 'interfaces/isap');
const Imongo = require(BASE + 'interfaces/imongo');
const Events = require(BASE + 'interfaces/events');
const FedicomError = require(BASE + 'model/fedicomError');
const Devolucion = require(BASE + 'model/devolucion/ModeloDevolucion');
const Tokens = require(BASE + 'util/tokens');
const Flags = require(BASE + 'interfaces/cache/flags');

// POST /devoluciones
exports.crearDevolucion = function (req, res) {

	L.xi(req.txId, ['Procesando transmisión como CREACION DE DEVOLUCION']);

	// Verificacion del estado del token
	let estadoToken = Tokens.verificaPermisos(req, res, {
		admitirSimulaciones: true
	})
	if (!estadoToken.ok) {
		Events.devoluciones.emitErrorCrearDevolucion(req, res, estadoToken.respuesta, estadoToken.motivo);
		return;
	}
	// Si se trata de una simulación, recreamos el token como si fuera de la farmacia
	if (estadoToken.usuarioSimulador) {
		let newToken = Tokens.generateJWT(req.txId, req.body.authReq, []);
		L.xd(req.txId, ['Se ha generado un token para la devolución simulada. Se sustituye por el de la petición simulada', newToken]);
		req.headers['authorization'] = 'Bearer ' + newToken;
		req.token = Tokens.verifyJWT(newToken, req.txId);
	}



	L.xd(req.txId, ['Analizando el contenido de la transmisión']);
	try {
		var devolucion = new Devolucion(req);
	} catch (fedicomError) {
		fedicomError = FedicomError.fromException(req.txId, fedicomError);
		L.xe(req.txId, ['Ocurrió un error al analizar la petición', fedicomError]);
		var responseBody = fedicomError.send(res);
		Events.devoluciones.emitErrorCrearDevolucion(req, res, responseBody, K.TX_STATUS.PETICION_INCORRECTA);
		return;
	}


	if (!devolucion.contienteLineasValidas()) {
		L.xd(req.txId, ['Todas las lineas contienen errores, se responden las incidencias sin llamar a SAP']);
		var responseBody = [devolucion.generarRespuestaExclusiones()];
		res.status(400).json(responseBody);
		Events.devoluciones.emitErrorCrearDevolucion(req, res, responseBody, K.TX_STATUS.PETICION_INCORRECTA);
		return;
	}

	L.xd(req.txId, ['El contenido de la transmisión es una devolución correcta', devolucion]);

	Events.devoluciones.emitInicioCrearDevolucion(req, devolucion);
	devolucion.limpiarEntrada(req.txId);
	Isap.realizarDevolucion(req.txId, devolucion, (sapError, sapResponse) => {

		if (sapError) {
			if (sapError.type === K.ISAP.ERROR_TYPE_NO_SAPSYSTEM) {
				var fedicomError = new FedicomError('HTTP-400', sapError.code, 400);
				L.xe(req.txId, ['Error al grabar la devolución', sapError]);
				var responseBody = fedicomError.send(res);
				Events.devoluciones.emitFinCrearDevolucion(res, responseBody, K.TX_STATUS.PETICION_INCORRECTA);
			}
			else {
				L.xe(req.txId, ['Incidencia en la comunicación con SAP - No se graba la devolución', sapError]);
				var fedicomError = new FedicomError('DEV-ERR-999', 'No se pudo registrar la devolución - Inténtelo de nuevo mas tarde', 503);
				var responseBody = fedicomError.send(res)
				Flags.set(req.txId, K.FLAGS.NO_SAP)
				Events.devoluciones.emitFinCrearDevolucion(res, responseBody, K.TX_STATUS.NO_SAP);
			}
			return;
		}

		var clientResponse = devolucion.obtenerRespuestaCliente(req.txId, sapResponse.body);
		var [estadoTransmision, numerosDevolucion, codigoRespuestaHttp] = clientResponse.estadoTransmision();

		res.status(codigoRespuestaHttp).json(clientResponse);
		Events.devoluciones.emitFinCrearDevolucion(res, clientResponse, estadoTransmision, { numerosDevolucion });

	});
}

// GET /devoluciones/:numeroDevolucion
exports.consultaDevolucion = function (req, res) {

	L.xi(req.txId, ['Procesando transmisión como CONSULTA DE DEVOLUCION']);

	var numeroDevolucion = req.params.numeroDevolucion || req.query.numeroDevolucion;

	if (!numeroDevolucion) {
		var fedicomError = new FedicomError('DEV-ERR-999', 'El parámetro "numeroDevolucion" es inválido', 400);
		var responseBody = fedicomError.send(res);
		Events.devoluciones.emitErrorConsultarDevolucion(req, res, responseBody, K.TX_STATUS.PETICION_INCORRECTA);
		return;
	}

	let estadoToken = Tokens.verificaPermisos(req, res)
	if (!estadoToken.ok) {
		Events.devoluciones.emitErrorConsultarDevolucion(req, res, estadoToken.respuesta, estadoToken.motivo);
		return;
	}

	Events.devoluciones.emitRequestConsultarDevolucion(req);
	Imongo.findTxByNumeroDevolucion(req.txId, numeroDevolucion, function (err, dbTx) {
		if (err) {
			var error = new FedicomError('DEV-ERR-999', 'No se pudo obtener la devolución - Inténtelo de nuevo mas tarde', 500);
			var responseBody = error.send(res);
			Events.devoluciones.emitErrorConsultarDevolucion(req, res, responseBody, K.TX_STATUS.CONSULTA.ERROR_DB);
			return;
		}

		L.xi(req.txId, ['Se recupera la transmisión de la base de datos', dbTx]);

		if (dbTx && dbTx.clientResponse) {
			// TODO: Autorizacion
			var originalBody = dbTx.clientResponse.body;
			var documentoDevolucion = null;

			if (originalBody && originalBody.length) {
				originalBody.some(function (doc) {
					if (doc && doc.numeroDevolucion && doc.numeroDevolucion === numeroDevolucion) {
						documentoDevolucion = doc;
						return true;
					}
					return false;
				});
			}

			if (documentoDevolucion) {
				res.status(200).json(documentoDevolucion);
				Events.devoluciones.emitResponseConsultarDevolucion(res, documentoDevolucion, K.TX_STATUS.OK);
			} else {
				L.xe(req.txId, ['No se encontró la devolución dentro de la transmisión.']);
				var error = new FedicomError('DEV-ERR-001', 'La devolución solicitada no existe', 404);
				var responseBody = error.send(res);
				Events.devoluciones.emitErrorConsultarDevolucion(req, res, responseBody, K.TX_STATUS.CONSULTA.NO_EXISTE);
			}
		} else {
			var error = new FedicomError('DEV-ERR-001', 'La devolución solicitada no existe', 404);
			var responseBody = error.send(res);
			Events.devoluciones.emitErrorConsultarDevolucion(req, res, responseBody, K.TX_STATUS.CONSULTA.NO_EXISTE);
		}
	});

}