'use strict';
//const C = global.config;
const L = global.logger;
//const K = global.constants;

// Interfaces
//const iTokens = require('global/tokens');
const iMongo = require('interfaces/imongo/iMongo');
const Maestro = require('global/maestro');

// Modelos
const SensorPrtg = require('modelos/prtg/SensorPrtg');


// GET /prtg/estadoPedidos
exports.consultaEstadoPedidos = async function (req, res) {

	let txId = req.txId;

	L.xi(txId, ['Consulta SENTINEL - EstadoPedidos']);


	let fecha = new Date();
	fecha.setHours(0, 0, 0, 0);

	let pipeline = [
		{
			$match: {
				type: 10,
				createdAt: { $gte: fecha }
			}
		},
		{
			$group: {
				_id: "$status",
				transmisiones: {
					$sum: 1
				}
			}
		}
	]



	let sensorPrtg = new SensorPrtg();

	try {

		let resultado = await iMongo.consultaTx.agregacion(pipeline);

		resultado.forEach(estado => {
			sensorPrtg.resultado(
				Maestro.transmisiones.getEstadoById(estado._id, 'pedidos')?.descripcionCorta,
				estado.transmisiones,
				'Count'
			)
		});



		
	} catch (errorMongo) {
		L.xw(txId, ['Ocurrió un error al realizar la agregación en mongoDB', errorMongo])
		sensorPrtg.ponerEnError('Ocurrió un error al realizar la agregación en mongoDB');
		return;
	}

	res.status(200).json(sensorPrtg);


}

