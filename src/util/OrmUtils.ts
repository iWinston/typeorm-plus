import * as fs from "fs";
import * as path from "path";

/**
 * Common utility functions.
 */
export class OrmUtils {

    /**
     * Makes "require()" all js files (or custom extension files) in the given directory.
     * @deprecated use npm module instead
     */
    static requireAll(directories: string[], extension: string = ".js"): any[] {
        let files: any[] = [];
        directories.forEach((dir: string) => {
            if (fs.existsSync(dir)) {
                fs.readdirSync(dir).forEach((file: string) => {
                    if (fs.statSync(dir + "/" + file).isDirectory()) {
                        let requiredFiles = this.requireAll([dir + "/" + file], extension);
                        requiredFiles.forEach((file: string) => files.push(file));
                    } else if (path.extname(file) === extension) {
                        files.push(require(dir + "/" + file));
                    }
                });
            }
        }); // todo: implement recursion
        return files;
    }

}