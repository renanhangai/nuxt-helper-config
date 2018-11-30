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
		const moduleOptions = useModules[ key ];
		if( moduleOptions === false )
			continue;
		useArray.push({ 
			variable: `VueModule${moduleIndex}`,
			module:   key,
			hasOptions: ( moduleOptions === true || moduleOptions == null ) ? false : true,
			optionsSource: toSource( moduleOptions ),
		});
		++moduleIndex;
	}
	return useArray;
}