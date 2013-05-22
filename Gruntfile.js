
module.exports = function(grunt) {
    'use strict';


    var pkg = require('./package.json');


    // Project configuration.
    grunt.initConfig({
        meta: {
            version: pkg.version
            , banner: '/**\n * ' + pkg.name + ' - v<%= meta.version %> \n' +
                ' * Copyright (c) <%= grunt.template.today("yyyy") %> Kiva Microfunds\n' +
                ' * \n' +
                ' * Licensed under the MIT license.\n' +
                ' * https://github.com/kiva/backbone.siren/blob/master/license.txt\n' +
                ' */\n'

        }


        , buster: {
            test: {
                reporter: 'specification'
            }
        }


        , jshint: {
            options: {
                jshintrc: '.jshintrc'
            }
            , all: ['src/*.js', 'test/spec/**/*.js']
        }


        , rig: {
            compile: {
                options: {
                    banner: '<%= meta.banner %>'
                }
                , files: {
                    'dist/amd/kvTip.js': ['build/_amd.js']
                    , 'dist/kvTip.js': ['build/_iife.js']
                }
            }
        }


        , uglify: {
            target: {
                options: {
                    banner: '<%= meta.banner %>'
                }
                , files: {
                    'dist/kvTip.min.js': ['dist/kvTip.js']
                    , 'dist/amd/kvTip.min.js': ['dist/amd/kvTip.js']
                }
            }
        }
    });


    grunt.loadNpmTasks('grunt-buster');
    grunt.loadNpmTasks('grunt-rigger');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('test', ['jshint' /*, 'buster'*/]);
    grunt.registerTask('build', ['test', 'rig', 'uglify']);
};