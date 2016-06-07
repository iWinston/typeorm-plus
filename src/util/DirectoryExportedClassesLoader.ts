import * as fs from "fs";
import * as path from "path";

/**
 * Loads all exported classes from the given directory.
 * @internal
 */
export class DirectoryExportedClassesLoader {

    // todo: this can be extracted into external module and used across all other modules

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Imports all entities (makes them "require") from the given directories.
     */
    importClassesFromDirectories(directories: string[]): Function[] {

        const allDirectories = directories.reduce((allDirs, dir) => {
            return allDirs.concat(require("glob").sync(path.normalize(dir)));
        }, [] as string[]);

        const requireAll = require("require-all");
        const filter = /(.*)\.(js)$/;
        // const filter = /(.*)\.(js|ts)$/;
        const dirs = allDirectories
            .filter(directory => fs.existsSync(directory))
            .map(directory => requireAll({ dirname: directory, filter: filter, recursive: true }));

        return this.loadFileClasses(dirs, []);
    }

    importJsonsFromDirectories(directories: string[]): any[] {

        const allDirectories = directories.reduce((allDirs, dir) => {
            return allDirs.concat(require("glob").sync(path.normalize(dir)));
        }, [] as string[]);

        const requireAll = require("require-all");
        const filter = /(.*)\.json$/;
        const loaded: { [fileName: string]: any }[] = allDirectories
            .filter(directory => fs.existsSync(directory))
            .map(directory => requireAll({ dirname: directory, filter: filter, recursive: true }));

        const flattened: any[] = [];
        loaded.forEach(file => Object.keys(file).forEach(key => {
            flattened.push(file[key]);
        }));
        return flattened;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private loadFileClasses(exported: any, allLoaded: Function[]) {
        if (exported instanceof Function) {
            allLoaded.push(exported);

        } else if (exported instanceof Object) {
            Object.keys(exported).forEach(key => this.loadFileClasses(exported[key], allLoaded));

        } else if (exported instanceof Array) {
            exported.forEach((i: any) => this.loadFileClasses(i, allLoaded));
        }

        return allLoaded;
    }

}

export function importClassesFromDirectories(directories: string[]): Function[] {
    const loader = new DirectoryExportedClassesLoader();
    return loader.importClassesFromDirectories(directories);
}

export function importJsonsFromDirectories(directories: string[]): any[] {
    const loader = new DirectoryExportedClassesLoader();
    return loader.importJsonsFromDirectories(directories);
}