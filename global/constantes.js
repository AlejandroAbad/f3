'use strict';

const os = require('os');

module.exports = {
	ESTADOS: {
		ERROR_GENERICO: 1000,
		RECEPCIONADO: 1010,
		PETICION_ENVIADA_A_SAP: 1020,
		OBTENIDA_RESPUESTA_DE_SAP: 1030,
		FALLO_AUTENTICACION: 3010,
		FALLO_AUTORIZACION: 3011,
		PETICION_INCORRECTA: 3020,
		ERROR_RESPUESTA_SAP: 3130,
		COMPLETADO: 9900,
		PEDIDO: {
			RECHAZADO_SAP: 3120,
			DUPLICADO: 3012,
			NO_SAP: 3110,
			ESPERANDO_NUMERO_PEDIDO: 8010,
			SIN_NUMERO_PEDIDO_SAP: 9140
		},
		CONFIRMAR_PEDIDO: {
			NO_ASOCIADA_A_PEDIDO: 9004,
		},
		CONSULTA: {
			ERROR: 9000,
			NO_EXISTE: 9005
		}

	},
	TIPOS: {
		PLANTILLA: -1,
		AUTENTICACION: 0,
		CREAR_PEDIDO: 10,
		CONSULTAR_PEDIDO: 11,
		CONFIRMAR_PEDIDO: 13,
		
	},
	TX_STATUS: {
		
		NO_SAP: 3110,
		RECHAZADO_SAP: 3120,
		ERROR_RESPUESTA_SAP: 3130,
		MAX_RETRANSMISIONES: 8110, /* DEPRECATED */
		OK: 9900,
		PEDIDO: {
			ESPERANDO_NUMERO_PEDIDO: 8010,
			ESPERA_AGOTADA: 8100,
			SIN_NUMERO_PEDIDO_SAP: 9140,
		},
		DEVOLUCION: {
			PARCIAL: 29000,
			RECHAZO_TOTAL: 29100
		},
		CONFIRMACION_PEDIDO: {
			NO_ASOCIADA_A_PEDIDO: 9004,
		},
		CONSULTA: {
			ERROR_DB: 9000,
			NO_EXISTE: 9005
		},
		LOGISTICA: {
			SIN_NUMERO_LOGISTICA: 9141,
		},
		RETRANSMISION: {
			OK: 19001,
			IMPOSIBLE: 19002,
			SOLO_FORZANDO: 19003,
		}
	},
	TX_TYPES: {
		INVALIDO: 999,

		DEVOLUCION: 20,
		CONSULTA_DEVOLUCION: 21,
		DEVOLUCION_DUPLICADA: 22,
		BUSCAR_ALBARANES: 30,
		CONSULTAR_ALBARAN: 31,
		CONFIRMACION_ALBARAN: 32,
		BUSCAR_FACTURAS: 40,
		CONSULTAR_FACTURA: 41,
		LOGISTICA: 50,
		CONSULTA_LOGISTICA: 51,
		LOGISTICA_DUPLICADA: 52
	},
	HOSTNAME: os.hostname().toLowerCase(),
	VERSION: {
		PROTOCOLO: '3.4.11',
		SERVIDOR: '2.0.0',
		TRANSMISION: 20000,
		GIT: {}
	},
	SOFTWARE_ID: {
		SERVIDOR: '0026',
		RETRANSMISOR: '9002'
	},
	PROCESOS: {
		getTitulo: function (tipo) {
			switch (tipo) {
				case 'master': return 'f3-master';
				case 'worker': return 'f3-worker';
				case 'watchdogPedidos': return 'f3-w-pedidos';
				case 'watchdogSqlite': return 'f3-w-sqlite';
				case 'monitor': return 'f3-monitor';
				default: return 'indefinido';
			}
		},
		TIPOS: {
			MASTER: 'master',
			WORKER: 'worker',
			WATCHDOG_PEDIDOS: 'watchdogPedidos',
			WATCHDOG_SQLITE: 'watchdogSqlite',
			MONITOR: 'monitor'
		}
	}
}




