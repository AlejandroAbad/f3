'use strict';
//const BASE = global.BASE;
//const C = global.config;
//const L = global.logger;
//const K = global.constants;

var dateFormat = require('dateformat');

/**
 * Date.fedicomTimestamp()
 * Devuelve el timestamp actual
 */
if (!Date.fedicomTimestamp) {
	Date.fedicomTimestamp = () => { 
		return new Date().getTime(); 
	}
}


dateFormat.masks.fedicomDate = 'dd/mm/yyyy';
dateFormat.masks.fedicomDateTime = 'dd/mm/yyyy HH:MM:ss';

dateFormat.masks.sapDate = 'yyyymmdd';

dateFormat.masks.shortDate = 'yyyymmdd';
dateFormat.masks.shortTime = 'HHMMss.l';

/**
 * Date.toFedicomDate(date)
 * Devuelve una representación del objeto Date en formato Fedicom3 Date.
 * Si no se especifica la fecha de entrada, se asume el instante actual.
 */
if (!Date.toFedicomDate) {
	Date.toFedicomDate = (date) => {
		if (!date || !date instanceof Date || isNaN(date)) date = new Date();
		return dateFormat(date, "fedicomDate")
	}
}

/**
 * Date.toFedicomDateTime(date)
 * Devuelve una representación del objeto Date en formato Fedicom3 DateTime.
 * Si no se especifica la fecha de entrada, se asume el instante actual.
 */
if (!Date.toFedicomDateTime) {
	Date.toFedicomDateTime = (date) => {
		if (!date || !date instanceof Date || isNaN(date)) date = new Date();
		return dateFormat(date, "fedicomDateTime")
	}
}

/**
 * Date.fromFedicomDate
 * Construye un objeto Date a partir de un string en formato Fedicom3 Date.
 */
if (!Date.fromFedicomDate) {
	Date.fromFedicomDate = (string) => {
		return Date.fromFedicomDateTime(string);
	}
}

/**
 * Date.fromFedicomDateTime
 * Construye un objeto Date a partir de un string en formato Fedicom3 DateTime.
 */
if (!Date.fromFedicomDateTime) {
	Date.fromFedicomDateTime = (string) => {
		if (!string) return null;

		var str = string.trim();
		var parts = str.split(/\s+/);


		var dateParts = parts[0].split(/[\/\-]/g);
		if (dateParts.length != 3) return null;
		
		if (parseInt(dateParts[2]) < 100) dateParts[2] = parseInt(dateParts[2]) + 2000; // Si el año es de 2 dígitos, le sumamos 2000. Ej. 21/11/19 -> 21/11/2019

		if (parts[1]) {
			var timeParts = parts[1].split(/\:/);
			while (timeParts.length < 3) timeParts.push(0);
		} else {
			var timeParts = [0,0,0];
		}

		try {
			var date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1], timeParts[2]);
			if (!date || !date instanceof Date || isNaN(date)) return null;
			return date;
		} catch (exception) {
			L.e('Date.fromFedicomDateTime: Error al convertir la fecha', string, exception);
			return null;
		}

	}
}

/**
 * Date.fromSAPtoFedicomDate
 * Convierte un string en formato fecha SAP (yyyy-mm-dd) a formato Fedicom3
 */
if (!Date.fromSAPtoFedicomDate) {
	Date.fromSAPtoFedicomDate = (sapDate) => {
		if (!sapDate) return null;

		var dateParts = sapDate.split(/\-/g);
		if (dateParts.length != 3) return null;

		return dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0];

	}
}



/**
 * Date.toFedicomDate(date)
 * Devuelve una representación del objeto Date en formato SAP (yyyymmdd).
 * Si no se especifica la fecha de entrada, se asume el instante actual.
 */
if (!Date.toSapDate) {
	Date.toSapDate = (date) => {
		if (!date || !date instanceof Date || isNaN(date)) date = new Date();
		return dateFormat(date, "sapDate")
	}
}

/**
 * Date.prototype.toShortDate
 * Devuelve una representación del objeto Date en formato corto (yyyymmdd).
 */
if (!Date.toShortDate) {
	Date.toShortDate = (date) => {
		if (!date || !date instanceof Date || isNaN(date)) date = new Date();
		return dateFormat(date, "shortDate")
	}
}


/**
 * Date.prototype.toShortTime
 * Devuelve una representación del objeto Date en formato corto (HHMMss.sss).
 */
if (!Date.toShortTime) {
	Date.toShortTime = (date) => {
		if (!date || !date instanceof Date || isNaN(date)) date = new Date();
		return dateFormat(date, "shortTime")
	}
}

