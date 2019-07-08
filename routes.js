'use strict';
const BASE = global.BASE;

const FedicomError = require(BASE + 'model/fedicomError');
const Events = require(BASE + 'interfaces/events');
var MongoDB = require('mongodb');
var ObjectID = MongoDB.ObjectID;

const L = global.logger;

module.exports = function(app) {
  var authenticate = require(BASE + 'controllers/authenticate');
  var pedidos = require(BASE + 'controllers/pedidos');
  var controladorDevoluciones = require(BASE + 'controllers/devoluciones');



  /* Middleware que se ejecuta antes de buscar la ruta correspondiente.
   * Detecta errores comunes en las peticiones entrantes tales como:
   *  - Errores en el parseo del JSON entrante.
   */
  app.use(function (error, req, res, next) {
    if (error) {
		var txId = new ObjectID();
      req.txId = res.txId = txId;

		L.e( '** Recibiendo transmisión erronea ' + txId + ' desde ' + req.ip );
		L.xe( txId, ['** OCURRIO UN ERROR AL PARSEAR LA TRANSMISION Y SE DESCARTA', error] );

      var fedicomError = new FedicomError(error);
      var responseBody = fedicomError.send(res);
      Events.emitDiscard(req, res, responseBody, error);
    } else {
      next();
    }
  });


  app.use(function (req, res, next) {
	  var txId = new ObjectID();
	  req.txId = res.txId = txId;
	  res.setHeader('X-TxID', txId);

	  L.i( '** Recibiendo transmisión ' + txId + ' desde ' + req.ip );
	  L.xt( txId, 'Iniciando procesamiento de la transmisión' );

    return next();
  });



  /* RUTAS */
	app.route('/authenticate')
		.post(authenticate.doAuth)
		.get(authenticate.verifyToken);

	app.route('/pedidos')
		.get(pedidos.getPedido)
		.post(pedidos.savePedido);

	app.route('/pedidos/:numeroPedido')
		.get(pedidos.getPedido);

	app.route('/devoluciones')
		.post(controladorDevoluciones.saveDevolucion);

	app.route('/devoluciones/:numeroDevolucion')
		.get(controladorDevoluciones.getDevolucion)


  /* Middleware que se ejecuta tras no haberse hecho matching con ninguna ruta. */
  app.use(function(req, res, next) {

    L.xw( req.txId, 'Se descarta la transmisión porque el endpoint [' + req.originalUrl + '] no existe' );
    var fedicomError = new FedicomError('CORE-404', 'No existe el endpoint indicado.', 404);
    var responseBody = fedicomError.send(res);
    Events.emitDiscard(req, res, responseBody, null);

    return;
  });

};
