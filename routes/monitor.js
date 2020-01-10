'use strict';
const BASE = global.BASE;

const FedicomError = require(BASE + 'model/fedicomError');
const ExpressExtensions = require(BASE + 'util/expressExtensions');

const L = global.logger;

module.exports = function (app) {

	var controllers = {
		consultas: require(BASE + 'controllers/monitor/consultasGenericas')
	}

	/* Middleware que se ejecuta antes de buscar la ruta correspondiente.
	 * Detecta errores comunes en las peticiones entrantes tales como:
	 *  - Errores en el parseo del JSON entrante.
	 */
	app.use(function (error, req, res, next) {
		if (error) {
			[req, res] = ExpressExtensions.extendReqAndRes(req, res);

			L.e('** Recibiendo transmisión erronea ' + req.txId + ' desde ' + req.originIp);
			L.xe(req.txId, ['** OCURRIO UN ERROR AL PARSEAR LA TRANSMISION Y SE DESCARTA', error]);

			var fedicomError = new FedicomError(error);
			fedicomError.send(res);
		} else {
			next();
		}
	});


	app.use(function (req, res, next) {
		
		[req, res] = ExpressExtensions.extendReqAndRes(req, res);

		L.i('** Recibiendo transmisión ' + req.txId + ' desde ' + req.ip);
		L.xt(req.txId, 'Iniciando procesamiento de la transmisión');

		return next();
	});



	/* RUTAS */
	app.route('/query') 
		.put(controllers.consultas.consultaMDB);


	/* Middleware que se ejecuta tras no haberse hecho matching con ninguna ruta. */
	app.use(function (req, res, next) {

		L.xw(req.txId, 'Se descarta la transmisión porque el endpoint [' + req.originalUrl + '] no existe');
		var fedicomError = new FedicomError('HTTP-404', 'No existe el endpoint indicado.', 404);
		fedicomError.send(res);

		return;
	});

};
