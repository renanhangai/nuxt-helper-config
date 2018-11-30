const path = require( "path" );
const toSource = require( "tosource" );

module.exports = function( moduleOptions ) {
	const useArray = normalizeUse( moduleOptions.use );
	if ( useArray.length <= 0 )
		return;
	this.addPlugin({
		src: path.resolve( __dirname, './vue-use.plugin.tjs' ),
		options: {
			useArray: useArray,
		},
	});
};

function normalizeUse( useModules ) {
	const useArray = [];
	let moduleIndex = 1;
	for ( const key in useModules ) {
		let moduleOptions = useModules[ key ];
		if( moduleOptions === false )
			continue;

		let priority = 0;
		if ( moduleOptions && typeof(moduleOptions) === 'object' ) {
			priority = moduleOptions.$priority | 0;
			moduleOptions = Object.assign( {}, moduleOptions );
			delete moduleOptions.$priority;
		}

		useArray.push({
			index: moduleIndex,
			priority: priority | 0,
			variable: `VueModule${moduleIndex}`,
			module:   key,
			hasOptions: ( moduleOptions === true || moduleOptions == null ) ? false : true,
			optionsSource: toSource( moduleOptions ),
		});
		++moduleIndex;
	}
	useArray.sort(function( a, b ) {
		return b.priority - a.priority;
	})
	return useArray;
}