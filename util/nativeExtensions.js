'use strict';
const BASE = global.BASE;

var dateFormat = require('dateformat');

/**
 * Date.fedicomTimestamp()
 * Devuelve el timestamp actual
 */
if (!Date.fedicomTimestamp) {
	Date.fedicomTimestamp = function() { return new Date().getTime(); }
}


dateFormat.masks.fedicomDate = 'dd/mm/yyyy';
dateFormat.masks.fedicomDateTime = 'dd/mm/yyyy HH:MM:ss';

/**
 * Date.toFedicomDate(date)
 * Devuelve una representación del objeto Date en formato Fedicom3 Date.
 * Si no se especifica la fecha de entrada, se asume el instante actual.
 */
if (!Date.toFedicomDate) {
	Date.toFedicomDate = function (date) {
		if (!date) date = new Date();
		return dateFormat(date, "fedicomDate")
	}
}

/**
 * Date.toFedicomDateTime(date)
 * Devuelve una representación del objeto Date en formato Fedicom3 DateTime.
 * Si no se especifica la fecha de entrada, se asume el instante actual.
 */
if (!Date.toFedicomDateTime) {
	Date.toFedicomDateTime = function (date) {
		if (!date) date = new Date();
		return dateFormat(date, "fedicomDateTime")
	}
}


/**
 * Date.fromFedicomDate
 * Construye un objeto Date a partir de un string en formato Fedicom3 Date.
 */
if (!Date.fromFedicomDate) {
	Date.fromFedicomDate = function (string) {
		if (!string) return null;
		
		var str = string.trim().split(/\s/)[0];
		str = str.replace(/\-/g, '/');

		var parts = str.split(/\//);

		if (parts.length != 3) return null;
		return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), '0', '0', '0');
	}
}

/**
 * Date.fromFedicomDateTime
 * Construye un objeto Date a partir de un string en formato Fedicom3 DateTime.
 */
if (!Date.fromFedicomDateTime) {
	Date.fromFedicomDateTime = function (string) {
		if (!string) return null;


		var str = string.trim();
		str = str.replace(/\-/g, '/');

		var parts = str.split(' ');
		if (parts.length != 2) return null;
		var dateParts = parts[0].split('/');
		if (dateParts.length != 3) return null;
		var timeParts = parts[1].split(':');
		if (timeParts.length != 3) return null;


		return new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1], timeParts[2]);
	}
}



if (!String.prototype.endsWith) {
	String.prototype.endsWith = function (searchString, position) {
		var subjectString = this.toString();
		if (typeof position !== 'number' || !isFinite(position)
			|| Math.floor(position) !== position || position > subjectString.length) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.indexOf(searchString, position);
		return lastIndex !== -1 && lastIndex === position;
	};
}
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function (searchString, position) {
		position = position || 0;
		return this.indexOf(searchString, position) === position;
	};
}

