const path = require( "path" );
const fs = require( "fs" );
const webpack = require( "webpack" );

/**

	Uses a new config file with:

	alias: The alias for webpack to resolve
	extend: Extends the webpack configuration
	features: Options for features
	middleware: Middlewares used by nuxt.router
	modules: Modules used by nuxt
	plugins: Plugin used by nuxt

 */

class NuxtConfigHelper {

	constructor( dir, config, options ) {
		this._dir     = dir;
		this._config = Object.assign( {}, config );
		this._options = Object.assign( {}, options );

		this._baseDir = path.basename( dir );

	}

	generate() {
		const ROOT_DIR = this._options.rootDir  || process.cwd();
		const BUILD_DIR = this._options.buildDir || ( process.env.APP_BUILD_DIR ? path.resolve( process.env.APP_BUILD_DIR ) : path.resolve( ROOT_DIR, "build" ) );
		const FEATURES_DIR = this._options.featuresDir || path.resolve( ROOT_DIR, "www/common/nuxt/features" );

		// Defaults
		const defaults = Object.assign( {}, this.defaults() );

		// Configuration
		const config = Object.assign( {}, this._config );
		config.alias      = Object.assign( {}, defaults.alias, config.alias );
		config.css        = [].concat( defaults.css ).concat( config.css );
		config.define     = Object.assign( {}, defaults.define, config.define );
		config.extend     = [].concat( defaults.extend ).concat( config.extend );
		config.head       = Object.assign( {}, defaults.head, config.head );
		config.plugins    = [].concat( defaults.plugins ).concat( config.plugins );
		config.modules    = [].concat( defaults.modules ).concat( config.modules );
		config.middleware = [].concat( defaults.middleware ).concat( config.middleware );
		config.provide    = Object.assign( {}, defaults.provide, config.provide );
		config.features   = Object.assign( {}, config.features, config.features );

		// Resolve features
		const packageJson = require( path.resolve( ROOT_DIR, 'package.json' ) );
		const helperFeatures = (packageJson["nuxt-helper-features"] || []).concat( Object.keys( config.features ) );
		const enabledFeatures = {};
		helperFeatures.forEach( ( f ) => {
			if ( enabledFeatures[f] )
				return;
			enabledFeatures[f] = true;
			const feature = require( path.resolve( FEATURES_DIR, f+".js" ) );
			const featureOptions = config.features ? config.features[f] : void(0);
			if ( featureOptions !== false )
				feature.call( null, config, featureOptions );
		});
		
		// The nuxt configuration
		const nuxtConfig = {
			mode: "spa",
			rootDir: ROOT_DIR,
			srcDir: this._dir,
			css: [].concat( config.css ).filter( Boolean ),
			head: {
				title: config.head.title,
				titleTemplate: config.head.titleTemplate,
				meta: [
					{ charset: 'utf-8' },
					{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
					{ hid: 'description', name: 'description', content: 'Meta description' }
				].concat( config.head.meta ).filter( Boolean ),
			},
			build: {
				extend: function( webpackConfig ) {
					// Resolve alias
					if ( config.alias ) {
						for ( const key in config.alias )
							webpackConfig.resolve.alias[ key ] = config.alias[key];
					}

					// Some plugins for provide & define
					webpackConfig.plugins.push( new webpack.DefinePlugin( asDefine( config.define ) ) );
					webpackConfig.plugins.push( new webpack.ProvidePlugin( config.provide ) );

					config.extend.forEach( ( fn ) => { 
						fn && fn.call( this, webpackConfig ); 
					} );
				},
			},
			buildDir: path.join( BUILD_DIR, "tmp/.nuxt", this._baseDir ),
			generate: {
				dir: path.join( BUILD_DIR, "www", this._baseDir ),
			},
			modules: [].concat( config.modules ).filter( Boolean ),
			plugins: [].concat( config.plugins ).filter( Boolean ),
			router: {
				middleware: [].concat( config.middleware ).filter( Boolean ),
			},
		};
		return nuxtConfig;
	}
};

// Convert to asDefine
function asDefine( obj ) {
	if ( Array.isArray( obj ) )
		return obj.map( asDefine );
	else if ( typeof obj === 'object' ) {
		const out = {};
		for ( const key in obj )
			out[key] = asDefine( obj[ key]  );
		return out;
	} else  
		return JSON.stringify( obj );
};

// Export the helpers
module.exports = {
	asDefine: asDefine,
	create( helperCreateOptions ) {
		helperCreateOptions = helperCreateOptions || {};
		const helperClass = helperCreateOptions.helperClass || NuxtConfigHelper;
		return function ( dir, config ) {
			const helper = new helperClass( dir, config, helperCreateOptions );
			return helper.generate();
		}
	},
};