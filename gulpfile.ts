import {Gulpclass, Task, SequenceTask, MergedTask} from "gulpclass";

const gulp = require("gulp");
const del = require("del");
const shell = require("gulp-shell");
const replace = require("gulp-replace");
const rename = require("gulp-rename");
const file = require("gulp-file");
const uglify = require("gulp-uglify");
const mocha = require("gulp-mocha");
const chai = require("chai");
const tslint = require("gulp-tslint");
const stylish = require("tslint-stylish");
const sourcemaps = require("gulp-sourcemaps");
const istanbul = require("gulp-istanbul");
const remapIstanbul = require("remap-istanbul/lib/gulpRemapIstanbul");
const ts = require("gulp-typescript");

@Gulpclass()
export class Gulpfile {

    // -------------------------------------------------------------------------
    // General tasks
    // -------------------------------------------------------------------------

    /**
     * Cleans build folder.
     */
    @Task()
    clean(cb: Function) {
        return del(["./build/**"], cb);
    }

    /**
     * Runs typescript files compilation.
     */
    @Task()
    compile() {
        return gulp.src("package.json", { read: false })
            .pipe(shell(["tsc"]));
    }

    /**
     */
    @Task()
    browserCopySources() {
        return gulp.src([
            "./src/**/*.ts",
            "!./src/commands/*.ts",
            "!./src/cli.ts",
            "!./src/typeorm.ts",
            "!./src/decorators-shim.ts",
            "!./src/platform/PlatformTools.ts",
            "!./src/platform/BrowserPlatformTools.ts"
        ])
            .pipe(gulp.dest("./build/browser/typeorm"));
    }

    @Task()
    browserCopyMainBrowserFile() {
        return gulp.src("./package.json", { read: false })
            .pipe(file("typeorm.ts", `export * from "./typeorm/index";`))
            .pipe(gulp.dest("./build/browser"));
    }

    @Task()
    browserCopyPlatformTools() {
        return gulp.src("./src/platform/BrowserPlatformTools.ts")
            .pipe(rename("PlatformTools.ts"))
            .pipe(gulp.dest("./build/browser/typeorm/platform"));
    }

    /**
     * Runs typescript files compilation.
     */
    @MergedTask()
    browserCompile() {
        const tsProject = ts.createProject("tsconfig.json", {
            outFile: "typeorm-browser.js",
            module: "system",
            target: "es6",
            typescript: require("typescript")
        });
        const tsResult = gulp.src(["./build/browser/**/*.ts", "./node_modules/@types/**/*.ts"])
            .pipe(sourcemaps.init())
            .pipe(tsProject());

        return [
            tsResult.dts.pipe(gulp.dest("./build/package")),
            tsResult.js
                .pipe(sourcemaps.write(".", { sourceRoot: "", includeContent: true }))
                .pipe(gulp.dest("./build/browser-package"))
        ];
    }

    /**
     */
    @SequenceTask()
    browser() {
        return [["browserCopySources", "browserCopyMainBrowserFile", "browserCopyPlatformTools"], "browserCompile", "uglify"];
    }

    /**
     */
    @Task()
    uglify() {
        return gulp.src("./build/browser-package/*.js")
            .pipe(uglify())
            .pipe(gulp.dest("./build/browser-package"));
    }

    // -------------------------------------------------------------------------
    // Packaging and Publishing tasks
    // -------------------------------------------------------------------------

    /**
     * Publishes a package to npm from ./build/package directory.
     */
    @Task()
    npmPublish() {
        return gulp.src("*.js", { read: false })
            .pipe(shell([
                "cd ./build/package && npm publish"
            ]));
    }

    /**
     * Copies all sources to the package directory.
     */
    @MergedTask()
    packageCompile() {
        const tsProject = ts.createProject("tsconfig.json", { typescript: require("typescript") });
        const tsResult = gulp.src(["./src/**/*.ts", "./node_modules/@types/**/*.ts"])
            .pipe(sourcemaps.init())
            .pipe(tsProject());

        return [
            tsResult.dts.pipe(gulp.dest("./build/package")),
            tsResult.js
                .pipe(sourcemaps.write(".", { sourceRoot: "", includeContent: true }))
                .pipe(gulp.dest("./build/package"))
        ];
    }

    /**
     * Moves all compiled files to the final package directory.
     */
    @Task()
    packageMoveCompiledFiles() {
        return gulp.src("./build/package/src/**/*")
            .pipe(gulp.dest("./build/package"));
    }

    /**
     * Removes /// <reference from compiled sources.
     */
    @Task()
    packageReplaceReferences() {
        return gulp.src("./build/package/**/*.d.ts")
            .pipe(replace(`/// <reference types="node" />`, ""))
            .pipe(replace(`/// <reference types="chai" />`, ""))
            .pipe(gulp.dest("./build/package"));
    }

    /**
     * Moves all compiled files to the final package directory.
     */
    @Task()
    packageClearCompileDirectory(cb: Function) {
        return del([
            "build/package/src/**"
        ], cb);
    }

    /**
     * Change the "private" state of the packaged package.json file to public.
     */
    @Task()
    packagePreparePackageFile() {
        return gulp.src("./package.json")
            .pipe(replace("\"private\": true,", "\"private\": false,"))
            .pipe(gulp.dest("./build/package"));
    }

    /**
     * Creates a package that can be published to npm.
     */
    @SequenceTask()
    package() {
        return [
            "clean",
            "packageCompile",
            "packageMoveCompiledFiles",
            ["packageClearCompileDirectory", "packageReplaceReferences", "packagePreparePackageFile"],
        ];
    }

    /**
     * Creates a package and publishes it to npm.
     */
    @SequenceTask()
    publish() {
        return ["package", "npmPublish"];
    }

    // -------------------------------------------------------------------------
    // Run tests tasks
    // -------------------------------------------------------------------------

    /**
     * Runs ts linting to validate source code.
     */
    @Task()
    tslint() {
        return gulp.src(["./src/**/*.ts", "./test/**/*.ts", "./sample/**/*.ts"])
            .pipe(tslint())
            .pipe(tslint.report(stylish, {
                emitError: true,
                sort: true,
                bell: true
            }));
    }

    /**
     * Runs before test coverage, required step to perform a test coverage.
     */
    @Task()
    coveragePre() {
        return gulp.src(["./build/compiled/src/**/*.js"])
            .pipe(istanbul())
            .pipe(istanbul.hookRequire());
    }

    /**
     * Runs post coverage operations.
     */
    @Task("coveragePost", ["coveragePre"])
    coveragePost() {
        chai.should();
        chai.use(require("sinon-chai"));
        chai.use(require("chai-as-promised"));

        return gulp.src(["./build/compiled/test/**/*.js"])
            .pipe(mocha())
            .pipe(istanbul.writeReports());
    }

    @Task()
    coverageRemap() {
        return gulp.src("./coverage/coverage-final.json")
            .pipe(remapIstanbul())
            .pipe(gulp.dest("./coverage"));
    }

    /**
     * Compiles the code and runs tests.
     */
    @SequenceTask()
    tests() {
        return ["compile", "tslint", "coveragePost", "coverageRemap"];
    }

}