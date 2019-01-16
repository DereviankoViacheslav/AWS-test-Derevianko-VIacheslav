'use strict';

/* параметры для gulp-autoprefixer */
const autoprefixerList = [
    'Chrome >= 45',
    'Firefox ESR',
    'Edge >= 12',
    'Explorer >= 10',
    'iOS >= 9',
    'Safari >= 9',
    'Android >= 4.4',
    'Opera >= 30'
];
/* пути к исходникам (src), к готовым файлам (build), к наблюдаемым (watch) */
const path = {
    build: {
        html: 'dest/',
        js: 'dest/js/',
        css: 'dest/css/',
        img: 'dest/img/',
        fonts: 'dest/fonts/'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/main.js',
        style: 'src/scss/main.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        css: 'src/scss/**/*.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './dest'
};
/* настройки сервера */
const config = {
    server: {
        baseDir: 'dest'
    },
    notify: false
};

/* подключаем gulp и плагины */
const gulp = require('gulp'), // подключаем Gulp
    browserSync = require('browser-sync'), // сервер для работы и автоматического обновления страниц
    plumber = require('gulp-plumber'), // модуль для отслеживания ошибок
    rigger = require('gulp-rigger'), // модуль для импорта содержимого одного файла в другой
    sourcemaps = require('gulp-sourcemaps'), // модуль для генерации карты исходных файлов
    sass = require('gulp-sass'), // модуль для компиляции SASS (SCSS) в CSS
    autoprefixer = require('gulp-autoprefixer'), // модуль для автоматической установки автопрефиксов
    cleanCSS = require('gulp-clean-css'), // плагин для минимизации CSS
    uglify = require('gulp-uglify'), // модуль для минимизации JavaScript
    cache = require('gulp-cache'), // модуль для кэширования
    imagemin = require('gulp-imagemin'), // плагин для сжатия PNG, JPEG, GIF и SVG изображений
    jpegrecompress = require('imagemin-jpeg-recompress'), // плагин для сжатия jpeg	
    pngquant = require('imagemin-pngquant'), // плагин для сжатия png
    del = require('del'); // плагин для удаления файлов и каталогов

/* задачи */

// запуск сервера
gulp.task('browsersync', function () {
    browserSync(config);
    gulp.watch(path.watch.css, gulp.series('css:build'));
    gulp.watch(path.watch.js, gulp.series('js:build'));
    gulp.watch(path.watch.img, gulp.series('image:build'));
    gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
    gulp.watch(path.watch.html, gulp.series('html:build'));
    gulp.watch(path.watch.html).on('change', browserSync.reload);
    // browserSync.watch('src/**').on('change', browserSync.reload);
});

// сбор html
gulp.task('html:build', function () {
    return gulp.src(path.src.html) // выбор всех html файлов по указанному пути
        .pipe(plumber()) // отслеживание ошибок
        .pipe(rigger()) // импорт вложений
        .pipe(gulp.dest(path.build.html)) // выкладывание готовых файлов
        .pipe(browserSync.stream());
        // .pipe(browserSync.reload({
        //     stream: true
        // })); // перезагрузка сервера
});

// сбор стилей
gulp.task('css:build', function () {
    return gulp.src(path.src.style) // получим main.scss
        .pipe(plumber()) // для отслеживания ошибок
        .pipe(sourcemaps.init()) // инициализируем sourcemap
        .pipe(sass()) // scss -> css
        .pipe(autoprefixer({ // добавим префиксы
            browsers: autoprefixerList
        }))
        .pipe(cleanCSS()) // минимизируем CSS
        .pipe(sourcemaps.write()) // записываем sourcemap
        .pipe(gulp.dest(path.build.css)) // выгружаем в dest
        .pipe(browserSync.stream());
        // .pipe(browserSync.reload({
        //     stream: true
        // })); // перезагрузим сервер
});

// сбор js
gulp.task('js:build', function () {
    return gulp.src(path.src.js) // получим файл main.js
        .pipe(plumber()) // для отслеживания ошибок
        .pipe(rigger()) // импортируем все указанные файлы в main.js
        .pipe(sourcemaps.init()) //инициализируем sourcemap
        .pipe(uglify()) // минимизируем js
        .pipe(sourcemaps.write()) //  записываем sourcemap
        .pipe(gulp.dest(path.build.js)) // положим готовый файл
        .pipe(browserSync.stream());
        // .pipe(browserSync.reload({
        //     stream: true
        // })); // перезагрузим сервер
});

// перенос шрифтов
gulp.task('fonts:build', function () {
    return gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});

// обработка картинок
gulp.task('image:build', function () {
    return gulp.src(path.src.img) // путь с исходниками картинок
        .pipe(cache(imagemin([ // сжатие изображений
            imagemin.gifsicle({
                interlaced: true
            }),
            jpegrecompress({
                progressive: true,
                max: 90,
                min: 80
            }),
            pngquant(),
            imagemin.svgo({
                plugins: [{
                    removeViewBox: false
                }]
            })
        ])))
        .pipe(gulp.dest(path.build.img)); // выгрузка готовых файлов
});

// удаление каталога build 
gulp.task('clean:build', function (done) {
    del(path.clean);
    done();
});

// очистка кэша
gulp.task('cache:clear', function () {
    return cache.clearAll();
});

// сборка
gulp.task('build',
    gulp.series(
        'clean:build',
        'css:build',
        'js:build',
        'fonts:build',
        'image:build',
        'html:build'
    )
);

// запуск задач при изменении файлов
// gulp.task('watch', function () {
//     gulp.watch(path.watch.html, gulp.series('html:build'));
//     gulp.watch(path.watch.css, gulp.series('css:build'));
//     gulp.watch(path.watch.js, gulp.series('js:build'));
//     gulp.watch(path.watch.img, gulp.series('image:build'));
//     gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
//     browserSync.watch('src/**').on('change', browserSync.reload);
// });

// задача по умолчанию
gulp.task('default',
    gulp.series('build', 'browsersync')
        // gulp.parallel('browsersync', 'watch'))
        // 'browsersync', 'watch')
);