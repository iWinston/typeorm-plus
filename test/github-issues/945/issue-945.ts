import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";

describe("github issues > #945 synchronization with multiple primary keys", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("schema should include two primary keys", () => Promise.all(connections.map(async connection => {
        const tableSchema = await connection.createQueryRunner().getTable("test_entity");
        
        if(tableSchema) {
            const firstId = tableSchema.columns.find(column => {
                return column.name == 'id1';
            });
            const secondId = tableSchema.columns.find(column => {
                return column.name == 'id2';
            });

            if(!firstId || !secondId) {   
                return false;
            }
            
            expect(tableSchema.primaryKeys).length(2);
            expect(firstId.isPrimary).to.be.true;
            expect(secondId.isPrimary).to.be.true;
        }

        // expect(results.length).to.be.equal(1);
        // expect(results).to.eql([{ id: 1, name: "Entity #1" }]);
    })));

});
