'use strict';
const BASE = global.BASE;
//const C = global.config;
const L = global.logger;
const K = global.constants;

const Imongo = require(BASE + 'interfaces/imongo');

function identifyAuthenticatingUser(req) {
	if (req && req.body && req.body.user) {
		return req.body.user;
	}
	return undefined;
}


module.exports.emitAuthRequest = function (req) {

	var reqData = {
		$setOnInsert: {
			_id: req.txId,
			createdAt: new Date()
		},
		$max: {
			modifiedAt: new Date(),
			status: K.TX_STATUS.RECEPCIONADO
		},
		$set: {
			authenticatingUser: identifyAuthenticatingUser(req),
			iid: global.instanceID,
			type: K.TX_TYPES.AUTENTICACION,
			clientRequest: {
				ip: req.originIp,
				protocol: req.protocol,
				method: req.method,
				url: req.originalUrl,
				route: req.route.path,
				headers: req.headers,
				body: req.body
			}
		}
	}

	L.xi(req.txId, ['Emitiendo COMMIT para evento AuthRequest'], 'txCommit');
	Imongo.buffer(reqData);

	//L.yell(req.txId, txTypes.AUTENTICAR, txStatus.RECEPCIONADO, [reqData['$setOnInsert'].authenticatingUser]);
}
module.exports.emitAuthResponse = function (res, responseBody, status) {
	var resData = {
		$setOnInsert: {
			_id: res.txId,
			createdAt: new Date()
		},
		$max: {
			modifiedAt: new Date(),
			status: status,
		},
		$set: {
			clientResponse: {
				timestamp: new Date(),
				status: res.statusCode,
				headers: res.getHeaders(),
				body: responseBody
			}
		}
	}

	L.xi(res.txId, ['Emitiendo COMMIT para evento AuthResponse'], 'txCommit');
	Imongo.commit(resData);

	//L.yell(res.txId, txTypes.AUTENTICAR, status, []);
}
