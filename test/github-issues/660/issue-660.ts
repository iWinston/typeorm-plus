import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {User} from "./entity/User";
import {SqlServerDriver} from "../../../src/driver/sqlserver/SqlServerDriver";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {expect} from "chai";

describe("github issues > #660 Specifying a RETURNING or OUTPUT clause with QueryBuilder", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    const user = new User();
    user.name = "Tim Merrison";

    it("should create an INSERT statement, including RETURNING clause as appropriate", () => Promise.all(connections.map(async connection => {

        const sql = connection.createQueryBuilder()
            .insert()
            .into(User)
            .values(user)
            .returning("INSERTED.*")
            .disableEscaping()
            .getSql();

        if (connection.driver instanceof SqlServerDriver) {
            expect(sql).to.equal("INSERT INTO user(name) OUTPUT INSERTED.* VALUES (@0)"); }
        else if (connection.driver instanceof PostgresDriver) {
            expect(sql).to.equal("INSERT INTO user(name) RETURNING INSERTED.* VALUES (@0)"); }
        else { // this is arguably an error case, since .returning() is only supported by PostgreSQL and MSSQL
            expect(sql).to.equal("INSERT INTO user(name) VALUES (@0)"); }
    })));

    it("should create an INSERT statement, including OUTPUT clause as appropriate", () => Promise.all(connections.map(async connection => {

        const sql = connection.createQueryBuilder()
            .insert()
            .into(User)
            .values(user)
            .output("INSERTED.*")
            .disableEscaping()
            .getSql();

        if (connection.driver instanceof SqlServerDriver) {
            expect(sql).to.equal("INSERT INTO user(name) OUTPUT INSERTED.* VALUES (@0)"); }
        else if (connection.driver instanceof PostgresDriver) {
            expect(sql).to.equal("INSERT INTO user(name) RETURNING INSERTED.* VALUES (@0)"); }
        else { // this is arguably an error case, since .returning() is only supported by PostgreSQL and MSSQL
            expect(sql).to.equal("INSERT INTO user(name) VALUES (@0)"); }
    })));

    it("should create an UPDATE statement, including RETURNING or OUTPUT clause as appropriate", () => Promise.all(connections.map(async connection => {

        // await connection.manager.save(user);

        const sql = connection.createQueryBuilder()
            .update(User)
            .set({ name: "Joe Bloggs" })
            .where("name = :name", { name: user.name })
            .returning("INSERTED.*")
            .disableEscaping()
            .getSql();

        if (connection.driver instanceof SqlServerDriver) {
            expect(sql).to.equal("UPDATE user SET name = @0 OUTPUT INSERTED.* WHERE name = @1"); }
        else if (connection.driver instanceof PostgresDriver) {
            expect(sql).to.equal("UPDATE user SET name = @0 RETURNING INSERTED.* WHERE name = @1"); }
        else { // this is arguably an error case, since .returning() is only supported by PostgreSQL and MSSQL
            expect(sql).to.equal("UPDATE user SET name = @0 WHERE name = @1"); }
    })));

    it("should create a DELETE statement, including RETURNING or OUTPUT clause as appropriate", () => Promise.all(connections.map(async connection => {

        // await connection.manager.save(user);

        const sql = connection.createQueryBuilder()
            .delete()
            .from(User)
            .where("name = :name", { name: user.name })
            .returning("DELETED.*")
            .disableEscaping()
            .getSql();

        if (connection.driver instanceof SqlServerDriver) {
            expect(sql).to.equal("DELETE FROM user OUTPUT DELETED.* WHERE name = @0"); }
        else if (connection.driver instanceof PostgresDriver) {
            expect(sql).to.equal("DELETE FROM user RETURNING DELETED.* WHERE name = @0"); }
        else { // this is arguably an error case, since .returning() is only supported by PostgreSQL and MSSQL
            expect(sql).to.equal("DELETE FROM user WHERE name = @0"); }
    })));

});
