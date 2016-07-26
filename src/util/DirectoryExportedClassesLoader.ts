import * as path from "path";

/**
 * Loads all exported classes from the given directory.
 */
export function importClassesFromDirectories(directories: string[], format: string = ".js"): Function[] {

    function loadFileClasses(exported: any, allLoaded: Function[]) {
        if (exported instanceof Function) {
            allLoaded.push(exported);

        } else if (exported instanceof Object) {
            Object.keys(exported).forEach(key => loadFileClasses(exported[key], allLoaded));

        } else if (exported instanceof Array) {
            exported.forEach((i: any) => loadFileClasses(i, allLoaded));
        }

        return allLoaded;
    }

    const allFiles = directories.reduce((allDirs, dir) => {
        return allDirs.concat(require("glob").sync(path.normalize(dir)));
    }, [] as string[]);

    const dirs = allFiles
        .filter(file => path.extname(file) === format)
        .map(file => require(file));

    return loadFileClasses(dirs, []);
}

export function importJsonsFromDirectories(directories: string[], format = ".json"): any[] {

    const allFiles = directories.reduce((allDirs, dir) => {
        return allDirs.concat(require("glob").sync(path.normalize(dir)));
    }, [] as string[]);

    return allFiles
        .filter(file => path.extname(file) === format)
        .map(file => require(file));
}