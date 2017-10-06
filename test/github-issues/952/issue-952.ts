import "reflect-metadata";
import {Table} from "../../../src/schema-builder/schema/Table";
import {TableColumn} from "../../../src/schema-builder/schema/TableColumn";
import {TablePrimaryKey} from "../../../src/schema-builder/schema/TablePrimaryKey";
import {expect} from "chai";

describe("github issues > #952 Table.addPrimaryKeys and Table.removePrimaryKeys", () => {
    let table: Table;
    beforeEach(() => {
        const column1 = new TableColumn({name: "column1", type: "number", isPrimary: true});
        const column2 = new TableColumn({name: "column2", type: "number"});
        table = new Table("test", [column1, column2]);
        table.addPrimaryKeys([new TablePrimaryKey("column1_index", "column1")]);
    });

    it("should set isPrimary to true when calling addPrimaryKeys", () => {
        const primaryKey = new TablePrimaryKey("column2_index", "column2");
        table.addPrimaryKeys([primaryKey]);
        expect(table.primaryKeys.length).to.equal(2);
        const column = table.findColumnByName("column2");
        expect(column).not.to.be.undefined;
        if (column)
            expect(column.isPrimary).to.be.true;
    });

    it("should set isPrimary to false when calling removePrimaryKeys", () => {
        const primaryKey = new TablePrimaryKey("column1_index", "column1");
        table.removePrimaryKeys([primaryKey]);
        expect(table.primaryKeys.length).to.equal(0);
        const column = table.findColumnByName("column1");
        expect(column).not.to.be.undefined;
        if (column)
            expect(column.isPrimary).to.be.false;
    });

});
