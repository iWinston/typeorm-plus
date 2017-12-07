/**
 * Converts string into camelCase.
 *
 * @see http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
 */
export function camelCase(str: string): string {
    return str.replace(/^([A-Z])|[\s-_](\w)/g, function(match, p1, p2, offset) {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();
    });
}

/**
 * Converts string into snake-case.
 *
 * @see http://stackoverflow.com/questions/30521224/javascript-convert-pascalcase-to-underscore-case
 */
export function snakeCase(str: string): string {
    return str.replace(/(?:^|\.?)([A-Z])/g, (x, y) => "_" + y.toLowerCase()).replace(/^_/, "");
}

/**
 * Converts string into title-case.
 *
 * @see http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
 */
export function titleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Builds abbreviated string from given string;
 */
export function abbreviate(str: string, abbrLettersCount: number = 1): string {
    const words = str.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, "$1 $2").split(" ");
    return words.reduce((res, word) => {
        res += word.substr(0, abbrLettersCount);
        return res;
    }, "");
}