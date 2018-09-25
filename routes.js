
'use strict';

const FedicomError = require('./model/FedicomError');
const Events = require('./interfaces/events');
const Mongoose = require('mongoose');

module.exports = function(app) {
  var authenticate = require('./controllers/authenticate');

  /* Middleware que se ejecuta antes de buscar la ruta correspondiente.
   * Detecta errores comunes en las peticiones entrantes tales como:
   *  - Errores en el parseo del JSON entrante.
   */
  app.use(function (error, req, res, next) {
    if (error) {
      req.txId = res.txId = Mongoose.Types.ObjectId();
      var fedicomError = new FedicomError(error);
      var responseBody = fedicomError.send(res);
      Events.emitDiscard(req, res, responseBody, error);
    } else {
      next();
    }
  });

  app.use(function (req, res, next) {
    req.txId = res.txId = Mongoose.Types.ObjectId();
    return next();
  });


  /* RUTAS */
  app.route('/authenticate')
    .post(authenticate.doAuth)
    .get(authenticate.verifyToken);






  /* Middleware que se ejecuta tras no haberse hecho matching con ninguna ruta. */
  app.use(function(req, res, next) {

    var fedicomError = new FedicomError('CORE-404', 'No existe el endpoint indicado.', 404);
    var responseBody = fedicomError.send(res);
    Events.emitDiscard(req, res, responseBody, null);

    return;
  });

};
