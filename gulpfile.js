/**
 * UI Schema's Gulpfile
 */

var gulp = require('gulp');
var babel = require('gulp-babel');
var header = require('gulp-header');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var jshint = require('gulp-jshint');
var uglifyJS = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var mocha = require('gulp-mocha');
var jade = require('gulp-jade');
var register = require('babel/register');

var pkg = require('./package.json');
var version = pkg.version;
var banner = '/*! Schema v<%= version %> | (c) 2015 Arxitics | MIT license */\n';

gulp.task('default', [
  'compile-js',
  'testing',
  'watch'
]);

gulp.task('compile-js', function () {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(gulp.dest('dist/schema'));
});

gulp.task('testing', function () {
  return gulp.src('test/**/*.js')
    .pipe(mocha({
      ui: 'bdd',
      reporter: 'spec'
    }));
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.js', [
    'compile-js'
  ]);

  gulp.watch('test/**/*.js', [
    'testing'
  ]);
});
