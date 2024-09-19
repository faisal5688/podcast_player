var fs = require('fs'),
    gulp = require('gulp'),
    clean = require('gulp-clean'),

    //sass = require('gulp-sass'),
    sass = require('gulp-sass')(require('sass'));

    handlebarsCurVer = require('handlebars'),
    handlebars = require('gulp-handlebars'),
    wrap = require('gulp-wrap'),
    declareNS = require('gulp-declare'),

    concat = require('gulp-concat'),
    cleanCSS = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),

    minimist = require('minimist'),
    knownOptions = {
        string: 'project',
        default: {
            project: 'vod'
        }
    },
    options = minimist(process.argv.slice(2), knownOptions),
    projName = options.project,
    buildType = options.buildType,
    scormVersion = options.scormVersion;

var paths = {
    libs: ['./libs/**/*.*', '!./libs/**/CVS/**/*.*'],
    resources: ['./resources/**/*.*', '!./resources/**/CVS/**/*.*', '!./resources/data/*.json', '!./resources/data/responses'],
    fonts: ['./sass/fonts/*.*', '!./sass/fonts/**/CVS/**/*.*'],
    intermediate: './js',
    json: {
        sourceDir: './resources/data/',
        outDir: 'resources/data/',
        files: ['config.json', 'course-data.json']
    },
    scorm: {
        sourceDir: './compliance/scorm-files/',
        files: {
            SCORM12: ['imsmanifest.xml', 'metadata.xml', 'adlcp_rootv1p2.xsd', 'imscp_rootv1p1p2.xsd', 'imsmd_rootv1p2p1.xsd'],
            SCORM2004: ['imsmanifest.xml', 'adlcp_v1p3.xsd', 'adlnav_v1p3.xsd', 'adlseq_v1p3.xsd', 'imscp_v1p1.xsd', 'imsss_v1p0.xsd', 'imsss_v1p0auxresource.xsd', 'imsss_v1p0control.xsd', 'imsss_v1p0delivery.xsd', 'imsss_v1p0limit.xsd', 'imsss_v1p0objective.xsd', 'imsss_v1p0random.xsd', 'imsss_v1p0rollup.xsd', 'imsss_v1p0seqrule.xsd', 'imsss_v1p0util.xsd']
        }
    },
    debug: {
        buildDir: './output/debug-' + projName + '-' + scormVersion + '/',
        in: {
            html: ['./index.html'],
            js: ['./js/app.js'],
            css: ['!./sass/CVS/**/*.scss', '!./src/**/CVS/**/*.scss', './sass/*.scss', './src/**/*.scss'],
            hbs: ['./src/**/*.hbs', '!./src/**/CVS/**/*.hbs']
        },
        out: {
            html: 'index.html',
            js: 'app.js',
            css: 'app.css',
            hbs: 'templates.js'
        }
    },
    release: {
        buildDir: './output/release-' + projName + '-' + scormVersion + '/',
        in: {
            html: ['./index-release.html']
        },
        out: {
            html: 'index.html',
            js: 'app.min.js'
        }
    }
};

////////// COMMON //////////
gulp.task('clean', function () {
    return gulp.src(paths[buildType].buildDir, {
            allowEmpty: true
        })
        .pipe(clean());
});

gulp.task('html', function () {
    return gulp.src(paths[buildType].in.html)
        .pipe(rename(paths[buildType].out.html))
        .pipe(gulp.dest(paths[buildType].buildDir));
});

gulp.task('libs', function () {
    return gulp.src(paths.libs, {
            "base": "./libs"
        })
        .pipe(gulp.dest(paths[buildType].buildDir + '/libs'));
});

gulp.task('resources', function () {
    return gulp.src(paths.resources, {
            "base": "./resources"
        })
        .pipe(gulp.dest(paths[buildType].buildDir + '/resources'));
});

gulp.task('fonts', function () {
    return gulp.src(paths.fonts, {
            "base": "./sass/fonts"
        })
        .pipe(gulp.dest(paths[buildType].buildDir + '/css/fonts'));
});

gulp.task('json', function (done) {
    if (paths.json.files) {
        var destDir = paths[buildType].buildDir + paths.json.outDir
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        for (var i = 0; i < paths.json.files.length; i++) {
            var src = paths.json.sourceDir + projName + '-' + paths.json.files[i],
                dest = destDir + paths.json.files[i];
            fs.copyFileSync(src, dest);
        }
    }
    done();
});

gulp.task('scorm-files', function (done) {
    if (paths.scorm) {
        var destDir = paths[buildType].buildDir;
        for (var i = 0; i < paths.scorm.files[scormVersion].length; i++) {
            var src = paths.scorm.sourceDir + scormVersion + '/' + paths.scorm.files[scormVersion][i],
                dest = destDir + paths.scorm.files[scormVersion][i];
            fs.copyFileSync(src, dest);
        }
    }
    done();
});

////////// COMMON //////////

////////// debug //////////

gulp.task('scripts', function () {
    return gulp.src(paths.debug.in.js)
        .pipe(gulp.dest(paths.debug.buildDir));
});

gulp.task('templates', function () {
    return gulp.src(paths.debug.in.hbs)
        .pipe(handlebars({
            handlebars: handlebarsCurVer
        }))
        .pipe(wrap('Handlebars.template(<%= contents %>)'))
        .pipe(declareNS({
            namespace: 'HBTemplates',
            noRedeclare: true
        }))
        .pipe(concat(paths.debug.out.hbs))
        .pipe(gulp.dest(paths.debug.buildDir));
});

gulp.task('clean-intermediate', function () {
    return gulp.src(paths.intermediate, {
            allowEmpty: true
        })
        .pipe(clean());
});

gulp.task('css', function () {
    return gulp.src(paths.debug.in.css)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(concat(paths.debug.out.css))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.debug.buildDir + '/css/'));
});

gulp.task('build-debug', gulp.parallel('html', 'libs', 'resources', 'fonts', 'scripts', 'templates', 'css'));
//////////// debug //////////

//////////// release //////////

gulp.task('min-script', function () {
    return gulp.src([paths.debug.buildDir + paths.debug.out.js, paths.debug.buildDir + paths.debug.out.hbs])
        .pipe(concat(paths.release.out.js))
        .pipe(uglify())
        .pipe(gulp.dest(paths.release.buildDir));
});

gulp.task('min-css', function () {
    return gulp.src(paths.debug.buildDir + '/css/' + paths.debug.out.css)
        .pipe(cleanCSS())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.release.buildDir + '/css/'));
});

gulp.task('build-prod', gulp.parallel('html', 'libs', 'resources', 'fonts', 'min-script', 'min-css'));
//////////// release //////////

gulp.task('default', gulp.series('clean', 'build-debug', 'json', 'clean-intermediate', 'scorm-files'));
gulp.task('prod', gulp.series('clean', 'build-prod', 'json', 'scorm-files'));


