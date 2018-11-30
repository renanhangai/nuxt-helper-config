

module.exports = {

	mapPriority( object, callback ) {
		const mapped = [];

		let index = 0;
		for ( const key in object ) {
			let value = object[key];
	
			let priority = 0;
			if ( value && typeof(value) === 'object' ) {
				priority = value.$priority | 0;
				value = Object.assign( {}, value );
				delete value.$priority;
			}

			const mappedValue = callback( value, key, index );
			index += 1;
			if ( mappedValue === false )
				continue;

			mapped.push({
				priority,
				value: mappedValue,
			});
		}
		mapped.sort(function( a, b ) {
			return b.priority - a.priority;
		});
		return mapped.map(function( item ) { return item.value; });
	}
}