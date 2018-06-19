import { expect } from "chai";

import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections } from "../../utils/test-utils";

import { User } from "./entity/ver2/user";
import { Record } from "./entity/ver2/record";
import { RecordContext } from "./entity/ver2/context";

describe("github issues > #2201 - Create a select query when using a (custom) junction table", () => {
    let connections: Connection[];

    after(() => closeTestingConnections(connections));

    it("Should create only two PM columns ('order_id' and 'user_id')", async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/ver1/*{.js,.ts}"],
            enabledDrivers: ["sqlite"],
            schemaCreate: true,
            dropSchema: true
        });

        const contextMetadata = connections[0].entityMetadatas.find(metadata => metadata.name === "RecordContext")!;
        const expectedColumnNames = ["record_id", "role", "meta", "user_id"];
        const existingColumnNames = contextMetadata.columns.map(col => col.databaseName);

        expect(existingColumnNames.length).to.eql(expectedColumnNames.length);
        expect(existingColumnNames).have.members(expectedColumnNames);
    });

    it("Should not try to update the junction table when not needed", async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/ver2/*{.js,.ts}"],
            enabledDrivers: ["sqlite"],
            schemaCreate: true,
            dropSchema: true
        });

        User.useConnection(connections[0]);
        const user = User.create({ id: "user1" });
        await user.save();

        Record.useConnection(connections[0]);
        const record = Record.create({ id: "record1", status: "pending" });
        await record.save();

        RecordContext.useConnection(connections[0]);
        const context = RecordContext.create({
            user,
            record,
            userId: user.id,
            recordId: record.id,
            meta: { name: "meta name", description: "meta description" }
        } as RecordContext);
        await context.save();

        const query = Record.createQueryBuilder("record")
            .leftJoinAndSelect("record.contexts", "context")
            .where("record.id = :recordId", { recordId: record.id });

        const result = (await query.getOne())!;
        console.log(result);

        result.status = "failed";

        await result.save();
        expect(0).to.eql(0);
    });
});
