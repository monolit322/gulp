let preprocessor = 'sass';

const { src, dest, parallel, series, watch} = require('gulp');
const browserSync  = require('browser-sync').create();
const concat       = require('gulp-concat');
const uglify       = require('gulp-uglify-es').default;
const sass         = require('gulp-sass')(require('sass'));
const less         = require('gulp-less');
const autoprefixer = require('gulp-autoprefixer');
const cleancss     = require('gulp-clean-css');
const imagecomp    = require('compress-images');
const clean        = require('gulp-clean');

function browsersync() {
    browserSync.init({
        server: { baseDir: 'app/' },
        notify: false,
        online: true,
    })
}

function scripts() {
    return src([
        'node_modules/jquery/dist/jquery.min.js',
        'app/js/app.js',
    ])
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js/'))
    .pipe(browserSync.stream())
}

function styles() {
    return src('app/' + preprocessor + '/main.' + preprocessor + '')
    .pipe(eval(preprocessor)())  /*eval - превращает переменную в ф-ию*/
    .pipe(concat('app.min.css'))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
    .pipe(cleancss(( { level: { 1: { specialComments: 0 } }/*, format: 'beautify' */} )))
    .pipe(dest('app/css/'))
    .pipe(browserSync.stream())
}

async function images() {
    imagecomp(
		"app/images/src/**/*", // Берём все изображения из папки источника
		"app/images/dest/", // Выгружаем оптимизированные изображения в папку назначения
		{ compress_force: false, statistic: true, autoupdate: true }, false, // Настраиваем основные параметры
		{ jpg: { engine: "mozjpeg", command: ["-quality", "75"] } }, // Сжимаем и оптимизируем изображеня
		{ png: { engine: "pngquant", command: ["--quality=75-100", "-o"] } },
		{ svg: { engine: "svgo", command: "--multipass" } },
		{ gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
		function (err, completed) { // Обновляем страницу по завершению
			if (completed === true) {
				browserSync.reload()
			}
		}
    )
}

function cleanimg() {
    return src('app/images/dest/', {allowEmpty: true})
    .pipe(clean())
}

function startWatch() {
    watch('app/**/' + preprocessor + '/**/*', styles);
    watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
    watch('app/**/*.html').on('change', browserSync.reload);
    watch('app/images/src/**/*', images)
}

function buildcopy() {
    return src([
        'app/css/**/*.min.css',
        'app/**/*.min.js',
        'app/images/dest/**/*',
        'app/**/*.html',
    ], { base: 'app' })
    .pipe(dest('dist'))
}

function cleandist() {
    return src('dist', { allowEmpty: true })
    .pipe(clean())
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
exports.images = images;
exports.cleanimg = cleanimg;

exports.build = series(cleandist, styles, scripts, images, buildcopy)

exports.default = parallel(styles, scripts, browsersync, startWatch)