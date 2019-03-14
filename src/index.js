const path = require( "path" );
const fs = require( "fs" );
const webpack = require( "webpack" );
const utils = require( "./utils" );

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
		this._config  = config;
		this._options = Object.assign( {}, options );

		this._baseDir = path.basename( dir );

	}

	getConfig( context ) {
		let config = this._config;
		if ( typeof(config) === 'function' )
			config = config.call( null, context );
		return Object.assign( {}, config );
	}

	generate() {
		const ROOT_DIR = this._options.rootDir  || process.cwd();
		const BUILD_DIR = this._options.buildDir || ( process.env.APP_BUILD_DIR ? path.resolve( process.env.APP_BUILD_DIR ) : path.resolve( ROOT_DIR, "dist" ) );
		const FEATURES_DIR = this._options.featuresDir || path.resolve( ROOT_DIR, "www/common/nuxt/features" );
		const CONFIG = this._options.config || {};

		// Defaults
		const defaults = Object.assign( {}, this._options.defaults );

		// Configuration
		const context = {
			rootDir: ROOT_DIR,
			buildDir: BUILD_DIR,
			featuresDir: FEATURES_DIR,
			outputDir: path.join(BUILD_DIR, "www", this._baseDir),
			config: CONFIG,
		};
		const config = this.getConfig( context );
		config.alias      = Object.assign( {}, defaults.alias, config.alias );
		config.css        = [].concat( defaults.css ).concat( config.css );
		config.define     = Object.assign( { CONFIG }, defaults.define, config.define );
		config.extend     = [].concat( defaults.extend ).concat( config.extend );
		config.head       = Object.assign( {}, defaults.head, config.head );
		config.plugins    = [].concat( defaults.plugins ).concat( config.plugins );
		config.modules    = [].concat( defaults.modules ).concat( config.modules );
		config.middleware = [].concat( defaults.middleware ).concat( config.middleware );
		config.provide    = Object.assign( {}, defaults.provide, config.provide );
		config.features   = Object.assign( {}, defaults.features, config.features );
		config.vueUse     = Object.assign( {}, defaults.vueUse, config.vueUse );
		config.nuxt       = Object.assign( {}, defaults.nuxt, config.nuxt );

		// Resolve features
		const features = utils.mapPriority( config.features, function( featureOptions, featureKey ) {
			if ( featureOptions === false )
				return false;
			return function() { 
				const feature = require( path.resolve( FEATURES_DIR, featureKey+".js" ) );
				feature.call( null, config, featureOptions || {}, context );
			};
		});
		features.forEach( ( f ) => f.call() );

		// Add module to vue-use
		config.modules.push([ path.resolve( __dirname, './modules/vue-use.js' ), { use: config.vueUse }] );
		
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
				...config.nuxt.head,
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
				...config.nuxt.build,
			},
			buildDir: path.join( BUILD_DIR, "tmp/.nuxt", this._baseDir ),
			generate: {
				dir: context.outputDir,
				...config.nuxt.generate,
			},
			modules: [].concat( config.modules ).filter( Boolean ),
			plugins: [].concat( config.plugins ).filter( Boolean ),
			router: {
				middleware: [].concat( config.middleware ).filter( Boolean ),
				...config.nuxt.router,
			},
		};
		delete config.nuxt.head;
		delete config.nuxt.build;
		delete config.nuxt.generate;
		delete config.nuxt.router;
		return { ...nuxtConfig, ...config.nuxt };
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