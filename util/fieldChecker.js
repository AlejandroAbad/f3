'use strict';
//const BASE = global.BASE;
//const C = global.config;
//const L = global.logger;
//const K = global.constants;

module.exports =  {
	/**
	 * Comprueba que un valor dado exista y no sea null.
	 * @param {*} field El valor a comprobar
	 * @param {ErrorFedicom} errorObject El objeto ErrorFedicom donde insertar el error en caso de existir
	 * @param {string} errorCode El código de error que se introduce en caso de error
	 * @param {string} errorDesc El mensaje de error que se introduce en caso de error
	 */
	checkExists: (field, errorObject, errorCode, errorDesc ) => {
		if (field === null || field === undefined) {
			if (errorObject) errorObject.add(errorCode, errorDesc, 400);
			return true;
		}
		return false;
	},

	/**
	 * Comprueba que un valor dado exista y no sea null.
	 * @param {*} field El valor a comprobar
	 * @param {ErrorFedicom} errorObject El objeto ErrorFedicom donde insertar el error en caso de existir
	 * @param {string} errorCode El código de error que se introduce en caso de error
	 * @param {string} errorDesc El mensaje de error que se introduce en caso de error
	 */
	checkNotEmptyString: (field, errorObject, errorCode, errorDesc) => {
		if (field === null || field === undefined || typeof field !== 'string' || field === "") {
			if (errorObject) errorObject.add(errorCode, errorDesc, 400);
			return true;
		}
		return false;
	},

	/**
	* Comprueba que un valor dado exista, sea un número y mayor que cero.
	 * @param {*} field El valor a comprobar
	 * @param {ErrorFedicom} errorObject El objeto ErrorFedicom donde insertar el error en caso de existir
	 * @param {string} errorCode El código de error que se introduce en caso de error
	 * @param {string} errorDesc El mensaje de error que se introduce en caso de error
	*/
	checkExistsAndPositive: (field, errorObject, errorCode, errorDesc ) => {
		if (field) {
			var asInt = Number(field);
			if (!asInt || asInt <= 0 || asInt === Number.NaN || asInt === Number.NEGATIVE_INFINITY || asInt === Number.POSITIVE_INFINITY ) {
				if (errorObject) errorObject.add(errorCode, errorDesc, 400);
				return true;
			}
		} else {
			if (errorObject) errorObject.add(errorCode, errorDesc, 400);
			return true;
		}
		return false;
	},

	/**
	* Comprueba que un valor dado exista, sea un número y mayor o igual que cero
	 * @param {*} field El valor a comprobar
	 * @param {ErrorFedicom} errorObject El objeto ErrorFedicom donde insertar el error en caso de existir
	 * @param {string} errorCode El código de error que se introduce en caso de error
	 * @param {string} errorDesc El mensaje de error que se introduce en caso de error
	*/
	checkExistsAndPositiveOrZero: (field, errorObject, errorCode, errorDesc ) => {
		if (field === 0) return false;
		return this.checkExistsAndPositive(field, errorObject, errorCode, errorDesc);
	},


	/**
	* Comprueba que un valor sea un número y mayor que cero. 
	* Si el valor no existe no se considera error.
	 * @param {*} field El valor a comprobar
	 * @param {ErrorFedicom} errorObject El objeto ErrorFedicom donde insertar el error en caso de existir
	 * @param {string} errorCode El código de error que se introduce en caso de error
	 * @param {string} errorDesc El mensaje de error que se introduce en caso de error
	*/
	checkPositive: (field, errorObject, errorCode, errorDesc ) => {
		if (field || field === 0) {
			var asInt = Number(field);
			if (!asInt || asInt <= 0 || asInt === Number.NaN || asInt === Number.NEGATIVE_INFINITY || asInt === Number.POSITIVE_INFINITY ) {
				if (errorObject) errorObject.add(errorCode, errorDesc, 400);
				return true;
			}
		}
		return false;
	},

	/**
	* Comprueba que un valor sea un número y mayor o igual que cero.
	* Si el valor no existe no se considera error.
	* @param {*} field El valor a comprobar
	* @param {ErrorFedicom} errorObject El objeto ErrorFedicom donde insertar el error en caso de existir
	* @param {string} errorCode El código de error que se introduce en caso de error
	* @param {string} errorDesc El mensaje de error que se introduce en caso de error
	*/
	checkPositiveOrZero: (field, errorObject, errorCode, errorDesc ) => {
		if (field === 0) return false;
		return this.checkPositive(field, errorObject, errorCode, errorDesc);
	},

	/**
	* Comprueba que un valor exista y que sea un array no vacío.
	* @param {*} field El valor a comprobar
	* @param {ErrorFedicom} errorObject El objeto ErrorFedicom donde insertar el error en caso de existir
	* @param {string} errorCode El código de error que se introduce en caso de error
	* @param {string} errorDesc El mensaje de error que se introduce en caso de error
	*/
	checkExistsAndNonEmptyArray: function checkExistsAndNonEmptyArray(field, errorObject, errorCode, errorDesc ) {
		if (!field || !field.forEach || field.length < 1) {
			if (errorObject) errorObject.add(errorCode, errorDesc, 400);
			return true;
		}
		return false;
	},

	/**
	* Comprueba que un valor sea un array.
	* Si el valor no existe no se considera error.
	* @param {*} field El valor a comprobar
	* @param {ErrorFedicom} errorObject El objeto ErrorFedicom donde insertar el error en caso de existir
	* @param {string} errorCode El código de error que se introduce en caso de error
	* @param {string} errorDesc El mensaje de error que se introduce en caso de error
	*/
	checkArray: function checkExistsAndNonEmptyArray(field, errorObject, errorCode, errorDesc) {
		if (field === null || field === undefined || field.forEach) {
			return false;
		}
		
		if (errorObject) errorObject.add(errorCode, errorDesc, 400);
		return true;
	},

	/**
	 * Comprueba que un valor dado exista y sea un string en formato Fedicom3 Date.
	 * @param {*} field El valor a comprobar
	 * @param {ErrorFedicom} errorObject El objeto ErrorFedicom donde insertar el error en caso de existir
	 * @param {string} errorCode El código de error que se introduce en caso de error
	 * @param {string} errorDesc El mensaje de error que se introduce en caso de error
	 */
	checkExistsAndDate: (field, errorObject, errorCode, errorDesc) => {

		var d = Date.fromFedicomDate(field);

		if (!d /*|| Date.toFedicomDate(d) !== field.trim().split(/\s/)[0].replace(/\-/g,'/')*/) {
			if (errorObject) errorObject.add(errorCode, errorDesc, 400);
			return true;
		}

		return false;
	}

}
