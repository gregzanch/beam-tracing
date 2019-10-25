// Copyright 2014 Andrei Karpushonak

/**
 * Byte sizes are taken from ECMAScript Language Specification
 * http://www.ecma-international.org/ecma-262/5.1/
 * http://bclary.com/2004/11/07/#a-4.3.16
 */

const SIZES = {
	STRING: 2,
	BOOLEAN: 4,
	NUMBER: 8
}

import { Buffer } from 'buffer';


export function sizeof_object(object) {
	if (object == null) {
		return 0
	}

	var bytes = 0
	for (var key in object) {
		if (!Object.hasOwnProperty.call(object, key)) {
			continue
		}

		bytes += sizeof(key)
		try {
			bytes += sizeof(object[key])
		} catch (ex) {
			if (ex instanceof RangeError) {
				// circular reference detected, final result might be incorrect
				// let's be nice and not throw an exception
				bytes = 0
			}
		}
	}

	return bytes
}

/**
 * Main module's entry point
 * Calculates Bytes for the provided parameter
 * @param object - handles object/string/boolean/buffer
 * @returns {*}
 */
export function sizeof(object) {
	if (Buffer.isBuffer(object)) {
		return object.length
	}

	var objectType = typeof (object)
	switch (objectType) {
		case 'string':
			return object.length * SIZES.STRING
		case 'boolean':
			return SIZES.BOOLEAN
		case 'number':
			return SIZES.NUMBER
		case 'object':
			if (Array.isArray(object)) {
				return object.map(sizeof).reduce(function (acc, curr) {
					return acc + curr
				}, 0)
			} else {
				return sizeof_object(object)
			}
		default:
			return 0
	}
}


