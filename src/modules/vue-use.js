const path = require( "path" );
const toSource = require( "tosource" );
const utils = require( "../utils" );

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
	return utils.mapPriority( useModules, function( moduleOptions, key, index ) {
		return {
			index: index,
			variable: `VueModule${index}`,
			module:   key,
			hasOptions: ( moduleOptions === true || moduleOptions == null ) ? false : true,
			hasOptionsFunction: ( typeof(moduleOptions) === 'function' ),
			optionsSource: toSource( moduleOptions ),
		};
	});
}