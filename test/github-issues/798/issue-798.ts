import "reflect-metadata";
import * as assert from "assert";
import {createConnection, getConnectionOptions} from "../../../src/index";

describe("github issues > #798 sqlite: 'database' path in ormconfig.json is not relative", () => {
    const oldCwd = process.cwd();

    before(function () {
        process.chdir("..");
    });

    after(function () {
        process.chdir(oldCwd);
    });

    it("should find the sqlite database if the cwd is changed", async function () {
        const options = await getConnectionOptions("sqlite");
        const connection = await createConnection(options);

        assert.strictEqual(connection.isConnected, true);
    });

});