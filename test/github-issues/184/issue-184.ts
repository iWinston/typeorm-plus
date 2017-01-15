import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Employee} from "./entity/Employee";
import {Homesitter} from "./entity/Homesitter";

describe("github issues > #184 [Postgres] Single-Inheritance not working with integer type field", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("single table inheritance should accept a Integer Type", () => Promise.all(connections.map(async connection => {

        let employeeRepository = connection.getRepository(Employee);
        const employee = new Employee();
        employee.id = "1";
        employee.firstName = "umed";
        employee.lastName = "khudoiberdiev";
        employee.salary = 200000;
        employee.shared = "e";

        await employeeRepository.persist(employee);
        const loadedEmployee = await employeeRepository.findOneById(1);
        console.log("loaded employee: ", loadedEmployee);


        let homesitterRepository = connection.getRepository(Homesitter);
        const homesitter = new Homesitter();
        homesitter.id = "2";
        homesitter.firstName = "umed";
        homesitter.lastName = "khudoiberdiev";
        homesitter.numberOfKids = 5;
        homesitter.shared = "h";

        await homesitterRepository.persist(homesitter);


    })));

});
