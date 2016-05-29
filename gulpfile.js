/* eslint-env node */
/* eslint no-sync: 0*/
const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const path = require('path');
// const fbjsConfigure = require('babel-preset-fbjs/configure');
// const gutil =require('gulp-util');


gulp.task('lib',[ 'flow' ], function () {
  return stdGulpTrans('src', './');
});

gulp.task('common', function () {
  return stdGulpTrans('src/common', 'dst/common');
});

gulp.task('clean', function () {
  return rmdir([
    'dist' ,
    'index.js',
    'index.js.flow',
    'index.js.map',
    'graphql.js',
    'graphql.js.flow',
    'graphql.js.map',
    'error/',
    'execution/',
    'jsutils/',
    'language/',
    'type/',
    'utilities/',
    'validation/' ] );
});

gulp.task('flow', function () {
  return flowType('src', './');
});

// ........functions .......
function flowType(src, dst) {
  const srcPath = [ src + '/**/*.js',
    '!' + src + '/**/__tests__/**', '!' + src + '/**/__mocks__/**' ];
  return gulp
    .src(srcPath)
    .pipe(rename({extname: '.js.flow'}))
    .pipe(gulp.dest(dst));
}

function stdGulpTrans(src, dst) {
  const sourceRoot = path.join(__dirname, src);
  const srcPath = [ src + '/**/*.js',
    '!' + src + '/**/__tests__/**', '!' + src + '/**/__mocks__/**' ];
  return gulp
    .src(srcPath)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: [ 'es2015', 'stage-0' ],
      plugins: [ 'transform-flow-strip-types' ]
    }) )
    .pipe(sourcemaps.write('.', {
      includeContent: true, sourceRoot, debug: true,
    }))
    .pipe(gulp.dest(dst));
}

const fs = require('fs');
function rmdir(pathNames) {
  pathNames.forEach(function (pathName) {
    if (!fs.existsSync(pathName)) { return; }
    const stat = fs.statSync(pathName);
    if ( stat.isFile()) {
      rmfile(pathName);
    }
    if (stat.isDirectory()) {
      const subPaths = fs.readdirSync(pathName)
        .map(function (subPathName) {
          return path.resolve(pathName, subPathName);
        });
      rmdir(subPaths);
      fs.rmdirSync(pathName);
    }
  });

  function rmfile(name) {
    fs.unlinkSync(name);
  }
}
