import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Employee} from "./entity/Employee";
import {Homesitter} from "./entity/Homesitter";
import {Person} from "./entity/Person";
import {expect} from "chai";

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

        // Saving via subtype repository works
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

        // let homesitterRepository = connection.getRepository(Homesitter);
        // const homesitter = new Homesitter();
        // homesitter.id = "2";
        // homesitter.firstName = "umed";
        // homesitter.lastName = "khudoiberdiev";
        // homesitter.numberOfKids = 5;
        // homesitter.shared = "h";
        // await homesitterRepository.persist(homesitter);

        // Saving via base type repository fails
        try {
            let personRepository = connection.getRepository(Person);
            const employee2 = new Employee();
            employee2.id = "1";
            employee2.firstName = "umed";
            employee2.lastName = "khudoiberdiev";
            employee2.salary = 200000;
            employee2.shared = "e";
            personRepository.persist(employee2)
        } catch (err) {
            throw err
        }


    })));

});
