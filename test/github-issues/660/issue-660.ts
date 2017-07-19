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

    it("should create an INSERT statement, including RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Tim Merrison";

        try {
            const sql = connection.createQueryBuilder()
                .insert()
                .into(User)
                .values(user)
                .returning(connection.driver instanceof PostgresDriver ? "*" : "inserted.*")
                .disableEscaping()
                .getSql();
    
            if (connection.driver instanceof SqlServerDriver) {
                expect(sql).to.equal("INSERT INTO user(name) OUTPUT inserted.* VALUES (@0)"); }
            else if (connection.driver instanceof PostgresDriver) {
                expect(sql).to.equal("INSERT INTO user(name) VALUES ($1) RETURNING *"); }
        } catch (err) {
            expect(err).to.eql(new Error("OUTPUT or RETURNING clause only supported by MS SQLServer or PostgreSQL")); }
    })));

    it("should perform insert with RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Tim Merrison";
    
        if (connection.driver instanceof SqlServerDriver || connection.driver instanceof PostgresDriver) {
            const returning = await connection.createQueryBuilder()
                .insert()
                .into(User)
                .values(user)
                .returning(connection.driver instanceof PostgresDriver ? "*" : "inserted.*")
                .execute();
    
            returning.should.be.eql([
                { id: 1, name: user.name }
            ]);
        }
    })));

    it("should create an UPDATE statement, including RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Tim Merrison";

        try {
            const sql = connection.createQueryBuilder()
                .update(User)
                .set({ name: "Joe Bloggs" })
                .where("name = :name", { name: user.name })
                .returning(connection.driver instanceof PostgresDriver ? "*" : "inserted.*")
                .disableEscaping()
                .getSql();
    
            if (connection.driver instanceof SqlServerDriver) {
                expect(sql).to.equal("UPDATE user SET name = @0 OUTPUT inserted.* WHERE name = @1");
            } else if (connection.driver instanceof PostgresDriver) {
                expect(sql).to.equal("UPDATE user SET name = $1 WHERE name = $2 RETURNING *");
            }
        } catch (err) {
            expect(err).to.eql(new Error("OUTPUT or RETURNING clause only supported by MS SQLServer or PostgreSQL")); }
    })));

    it("should perform update with RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Tim Merrison";

        await connection.manager.save(user);

        if (connection.driver instanceof SqlServerDriver || connection.driver instanceof PostgresDriver) {
            const returning = await connection.createQueryBuilder()
                .update(User)
                .set({ name: "Joe Bloggs" })
                .where("name = :name", { name: user.name })
                .returning(connection.driver instanceof PostgresDriver ? "*" : "inserted.*")
                .execute();
    
            returning.should.be.eql([
                { id: 1, name: "Joe Bloggs" }
            ]);
        }
    })));

    it("should create a DELETE statement, including RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", () => Promise.all(connections.map(async connection => {

        try {
            const user = new User();
            user.name = "Tim Merrison";
    
            const sql = connection.createQueryBuilder()
                .delete()
                .from(User)
                .where("name = :name", { name: user.name })
                .returning(connection.driver instanceof PostgresDriver ? "*" : "deleted.*")
                .disableEscaping()
                .getSql();
    
            if (connection.driver instanceof SqlServerDriver) {
                expect(sql).to.equal("DELETE FROM user OUTPUT deleted.* WHERE name = @0");
            } else if (connection.driver instanceof PostgresDriver) {
                expect(sql).to.equal("DELETE FROM user WHERE name = $1 RETURNING *");
            }
        } catch (err) {
            expect(err).to.eql(new Error("OUTPUT or RETURNING clause only supported by MS SQLServer or PostgreSQL")); }
    })));

    it("should perform delete with RETURNING or OUTPUT clause (PostgreSQL and MSSQL only)", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Tim Merrison";

        await connection.manager.save(user);

        if (connection.driver instanceof SqlServerDriver || connection.driver instanceof PostgresDriver) {
            const returning = await connection.createQueryBuilder()
                .delete()
                .from(User)
                .where("name = :name", { name: user.name })
                .returning(connection.driver instanceof PostgresDriver ? "*" : "deleted.*")
                .execute();
    
            returning.should.be.eql([
                { id: 1, name: user.name }
            ]);
        }
    })));

});
