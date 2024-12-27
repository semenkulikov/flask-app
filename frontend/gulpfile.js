const { src, dest, series, parallel, watch } = require("gulp");

const htmlmin = require("gulp-htmlmin");
// const fileinclude = require("gulp-file-include");
const pug = require("gulp-pug");
const rename = require("gulp-rename");

const sourcemaps = require("gulp-sourcemaps");

const gulpif = require("gulp-if");

const sass = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
const gcmq = require("gulp-group-css-media-queries");
const cleanCSS = require("gulp-clean-css");

const uglify = require("gulp-uglify");

const svgSprite = require("gulp-svg-sprite");

const flatten = require("gulp-flatten");

const notify = require("gulp-notify");
const del = require("del");
const plumber = require("gulp-plumber");
const browserSync = require("browser-sync").create();

const srcPath = "src/";
const distPath = "dist/";

let isProd = process.env.NODE_ENV?.replace(" ", "") === "prod";

const path = {
	build: {
		html: distPath,
		css: distPath + "assets/css",
		js: distPath + "assets/js",
		img: distPath + "assets/img",
		svg: distPath + "assets/img/svg",
		video: distPath + "assets/video",
		fonts: distPath + "assets/fonts",
		vendors: distPath + "assets/vendors",
	},

	src: {
		html: srcPath + "*.html",
		css: srcPath + "assets/scss/**/*.{scss,css}",
		js: srcPath + "assets/js/**/*.js",
		img: srcPath + "assets/**/*.{jpg,jpeg,png,webp,avif}",
		svg: srcPath + "assets/img/svg/",
		video: srcPath + "assets/video/**/*",
		fonts: srcPath + "assets/fonts/**/*",
		vendors: srcPath + "assets/vendors/**/*.{css,js}",
	},

	clean: distPath,
};

const html = () => {
	return src(path.src.html)
		.pipe(
			gulpif(
				isProd,
				htmlmin({ collapseWhitespace: true, removeComments: true })
			)
		)
		.pipe(dest(path.build.html))
		.pipe(browserSync.reload({ stream: true }));
};

const pugTask = () => {
	return src(srcPath + "/template/pages/**/*.pug")
		.pipe(
			pug({
				pretty: isProd,
			})
		)
		.pipe(rename({ extname: ".html" }))
		.pipe(
			gulpif(
				isProd,
				htmlmin({ collapseWhitespace: true, removeComments: true })
			)
		)
		.pipe(dest(path.build.html))
		.pipe(browserSync.reload({ stream: true }));
};

const css = () => {
	return src(path.src.css)
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: "SCSS Error",
						message: "Error: <%= error.message %>",
					})(err);
					this.emit("end");
				},
			})
		)
		.pipe(gulpif(!isProd, sourcemaps.init()))
		.pipe(sass())
		.pipe(gulpif(!isProd, sourcemaps.write()))
		.pipe(gcmq())
		.pipe(
			autoprefixer({
				cascade: false,
			})
		)
		.pipe(gulpif(isProd, cleanCSS({ level: 2 })))
		.pipe(dest(path.build.css))
		.pipe(browserSync.reload({ stream: true }));
};

const js = () => {
	return src(path.src.js)
		.pipe(
			plumber({
				errorHandler: function (err) {
					notify.onError({
						title: "JS Error",
						message: "Error: <%= error.message %>",
					})(err);
					this.emit("end");
				},
			})
		)
		.pipe(gulpif(isProd, uglify()))
		.pipe(dest(path.build.js))
		.pipe(browserSync.reload({ stream: true }));
};

const img = () => {
	return src(path.src.img).pipe(flatten()).pipe(dest(path.build.img));
};

const video = () => {
	return src(path.src.video).pipe(dest(path.build.video));
};

const svg = () => {
	return src(path.src.svg + "*.svg")
		.pipe(dest(path.build.svg))
		.pipe(browserSync.reload({ stream: true }));
};

const svgToSprite = () => {
	return src(path.src.svg + "sprite/**/*.svg")
		.pipe(
			svgSprite({
				mode: {
					symbol: {
						sprite: "../sprite.svg",
					},
				},
			})
		)
		.pipe(dest(path.build.svg))
		.pipe(browserSync.reload({ stream: true }));
};

const vendors = () => {
	return src(path.src.vendors)
		.pipe(dest(path.build.vendors))
		.pipe(browserSync.reload({ stream: true }));
};

const fonts = () => {
	return src(path.src.fonts)
		.pipe(dest(path.build.fonts))
		.pipe(browserSync.reload({ stream: true }));
};

const clean = () => {
	return del(path.clean);
};

const serve = () => {
	browserSync.init({
		server: {
			baseDir: distPath,
		},
	});
};

const dev = series(
	clean,
	parallel(pugTask, css, js, img, video, svg, svgToSprite, vendors, fonts),
	serve
);

const build = series(
	clean,
	parallel(pugTask, css, js, img, video, svg, svgToSprite, vendors, fonts)
);

const preview = series(serve);

const watchFiles = () => {
	watch([srcPath + "**/*.pug"], pugTask);
	watch([path.src.css], css);
	watch([path.src.js], js);
	watch([path.src.img], img);
	watch([path.src.video], video);
	watch([path.src.svg + "**/*.svg"], svg);
	watch([path.src.svg + "sprite/**/*.svg"], svgToSprite);
	watch([path.src.vendors], vendors);
	watch([path.src.fonts], fonts);
};

const runParallel = parallel(dev, watchFiles);

exports.html = html;

exports.css = css;
exports.js = js;
exports.img = img;
exports.video = video;
exports.svg = svg;
exports.svgToSprite = svgToSprite;
exports.dev = dev;
exports.build = build;
exports.vendors = vendors;
exports.fonts = fonts;
exports.preview = preview;
exports.watchFiles = watchFiles;

exports.default = runParallel;
