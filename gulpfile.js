/**
 * Created by iamchenxin on 1/29/16.
 */
var gulp=require('gulp');
var babel=require('gulp-babel');
var sourcemaps=require('gulp-sourcemaps');
var path=require('path');
var gutil =require('gulp-util');

gulp.task('learn', function () {
  return gulp.src(['learn/src/**/*.js'])
    .pipe(sourcemaps.init())
    .pipe(  babel({ 'presets': ["es2015","stage-0","react"]} ) )
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('learn/dst/'));
});

gulp.task('mysrc', function () {
  return gulp.src(['src/**/*.js'])
    .pipe(sourcemaps.init())
    .pipe(  babel({ 'presets': ["es2015","stage-0","react"]} ) )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('mydst/'));
});