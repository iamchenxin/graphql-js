/* eslint-env node */
/* eslint no-sync: 0*/
const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const path = require('path');
const fbjsConfigure = require('babel-preset-fbjs/configure');
// const gutil =require('gulp-util');


gulp.task('lib', function () {
  return stdGulpTrans('src', 'lib');
});

gulp.task('common', function () {
  return stdGulpTrans('src/common', 'dst/common');
});

gulp.task('clean', function () {
  return rmdir([
    'dist' ,
    'index.js',
    'index.js.flow',
    'graphql.js',
    'graphql.js.flow',
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
      presets: [
        fbjsConfigure({
          autoImport: false,
          target: 'js',
        }),
      ],
    }))
    .pipe(sourcemaps.write('.', {
      includeContent: true, sourceRoot, debug: true,
    }))
    .pipe(gulp.dest(dst));
}


const fs = require('fs');
function rmdir(pathNames) {
  pathNames.forEach(function (pathName) {
    const stat = fs.statSync(pathName);
    if ( stat.isFile()) {
      rmfile(pathName);
      console.log('delete file : ' + pathName);
    }
    if (stat.isDirectory()) {
      const subPaths = fs.readdirSync(pathName)
        .map(function (subPathName) {
          return path.resolve(pathName, subPathName);
        });
      rmdir(subPaths);
      fs.rmdirSync(pathName);
      console.log('delete DIR : ' + pathName);
    }
  });

  function rmfile(name) {
    fs.unlinkSync(name);
  }
}
