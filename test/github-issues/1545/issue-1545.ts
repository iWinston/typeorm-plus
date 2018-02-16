import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import { createTestingConnections, reloadTestingDatabases, closeTestingConnections } from "../../utils/test-utils";
import { ValidationModel } from "./entity/validation";
import { MainModel } from "./entity/main";
import { DataModel } from "./entity/data";

describe("github issues > #1545 Typeorm runs insert query instead of update query on save of existing entity for ManyToOne relationships", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should add intial validation data", () => Promise.all(connections.map(async connection => {
        const validation1 = new ValidationModel();
        validation1.validation = 123;

        const validation2 = new ValidationModel();
        validation2.validation = 456;
        await Promise.all([await connection.manager.save(validation1), await connection.manager.save(validation2)]);

        const data1_1 = new DataModel(); 
        data1_1.active = true;
        data1_1.validations = validation1;
        
        const main1 = new MainModel();
        main1.dataModel = [data1_1];
        
        const saveMain1 = await connection.manager.save(main1);

        console.dir(saveMain1, {colors: true, depth: null});

        main1.dataModel[0].active = false;
        const saveMain1again = await connection.manager.save(main1);
        console.dir(saveMain1again, {colors: true, depth: null});
        
        return true;

    })));

});