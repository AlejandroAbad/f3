'use strict';

const config = global.config;
const Isap = require('../interfaces/isap');
const Events = require('../interfaces/events');
const FedicomError = require('../model/FedicomError');






exports.doAuth = function (req, res) {

  Events.emitAuthRequest(req);


  var AuthReq = require('../model/authReq');
  try {
    var authReq = new AuthReq(req.body);
  } catch (ex) {
    console.error(ex);
    return ex.send(res);
  }

  Isap.authenticate(req.txId, authReq, function (sapErr, sapRes, sapBody) {
    if (sapErr) {
      var token = authReq.generateJWT(true);
      var responseBody = {auth_token: token};
      res.status(201).json(responseBody);
      Events.emitAuthResponse(res, responseBody, 'OK_NO_SAP');
      return;
    }

    if (sapBody.username) {
      // AUTH OK POR SAP
      var token = authReq.generateJWT();
      var responseBody = {auth_token: token};
      res.status(201).json(responseBody);
      Events.emitAuthResponse(res, responseBody);
    } else {
      // SAP INDICA QUE EL USUARIO NO ES VALIDO
      var fedicomError = new FedicomError('AUTH-005', 'Usuario o contraseña inválidos', 401);
      var responseBody = fedicomError.send(res);
      Events.emitAuthResponse(res, responseBody, 'AUTH_ERROR');
    }

  });
}

/**
Servicio para la verificación de tokens.
Para depuración exclusivamente.
*/
exports.verifyToken = function (req, res) {

  if (req.token) {
    const crypto = require('../util/crypto');
    var tokenData = crypto.verifyJWT(req.token);
    res.status(200).send({token: req.token, token_data: tokenData});
  } else {
    var tokenData = { meta: { ok: false, error: 'No se incluye token' } };
    res.status(200).send({token: req.token, token_data: tokenData});
  }


}
