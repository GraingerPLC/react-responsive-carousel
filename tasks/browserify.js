var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var reactify = require('reactify'); 
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var notify = require('gulp-notify');
var gutil = require('gulp-util');
var glob = require('glob');
var path = require('path');
var streamify = require('gulp-streamify');
var connect = require('gulp-connect');


var configs = require('./configs');

var dependencies = [
	'react',
  	'react/addons'
];

module.exports = function (options) {
	var isDevelopment = (options.environment === "development");
	var isNpmModule = (options.environment === "package");

	if (!isDevelopment) {
		// var bPackage = browserify({
		// 	entries: [
		// 		configs.paths.source + '/components/Carousel.js',
		// 		configs.paths.source + '/components/ImageGallery.js'
		// 	], 
		// 	transform: [["reactify", {"es6": true}]], 
		// 	debug: false, 
		// 	fullPaths: false,
		// 	extension: ['js'],
		// 	noParse: [
		// 		require.resolve('react')
		// 	]
		// });

		var carouselBundler = browserify({
			entries: [
				configs.paths.source + '/components/Carousel.js'
			], 
	   		transform: [["reactify", {"es6": true}]], 
			extension: ['js'],
			noParse: [
				require.resolve('react'),
				require.resolve('ainojs-finger')
			]
		});

		var galleryBundler = browserify({
			entries: [
				configs.paths.source + '/components/ImageGallery.js'
			], 
	   		transform: [["reactify", {"es6": true}]], 
			extension: ['js'],
			noParse: [
				require.resolve('react')
			]
		});

		// bPackage.bundle({standalone: __filename})
		// 	.on('error', gutil.log)
		// 	.pipe(source(__filename))
		// 	.pipe(gulp.dest(configs.folders[options.environment]))
		// 	.pipe(notify(function () {
		// 		gutil.log('Carousel bundle built');
		// 	}));


		carouselBundler.bundle()
			.on('error', gutil.log)
			.pipe(source('Carousel.js'))
			.pipe(gulp.dest(configs.folders[options.environment]))
			.pipe(notify(function () {
				gutil.log('Carousel bundle built');
			}));

		galleryBundler.bundle()
			.on('error', gutil.log)
			.pipe(source('ImageGallery.js'))
			.pipe(gulp.dest(configs.folders[options.environment]))
			.pipe(notify(function () {
				gutil.log('ImageGallery bundle built');
			}));
			

	} else {


		// Our app bundler
		var appBundler = browserify({
			entries: [configs.paths.source + '/main.js'], 
	   		transform: [["reactify", {"es6": true}]], 
			debug: isDevelopment, 
			fullPaths: isDevelopment,
			paths: ['./node_modules','./src'],
			extension: ['js']
		});

		// We set our dependencies as externals on our app bundler when developing		
		// (isDevelopment ? dependencies : []).forEach(function (dep) {
		// 	appBundler.external(dep);
		// });

		// The rebundle process
		var rebundle = function () {
			var start = Date.now();
			gutil.log('Building APP bundle');
			appBundler.bundle()
				.on('error', gutil.log)
				.pipe(source('main.js'))
				.pipe(gulpif(!isDevelopment, streamify(uglify())))
				.pipe(gulp.dest(configs.folders[options.environment]))
				.pipe(notify(function () {
					gutil.log('APP bundle built in ' + (Date.now() - start) + 'ms');
				}))
				.pipe(connect.reload());
		};



		rebundle();
	}

	return {
		app: rebundle, 

		vendor: function () {
			var vendorsBundler = browserify({
				debug: true,
				require: dependencies
			});

			// Run the vendor bundle
			var start = new Date();
			gutil.log('Building VENDORS bundle');
			vendorsBundler.bundle()
				.on('error', gutil.log)
				.pipe(source('vendors.js'))
				.pipe(gulpif(!isDevelopment, streamify(uglify())))
				.pipe(gulp.dest(configs.folders[options.environment]))
				.pipe(notify(function () {
					gutil.log('VENDORS bundle built in ' + (Date.now() - start) + 'ms');
				}));
		}
	}
}