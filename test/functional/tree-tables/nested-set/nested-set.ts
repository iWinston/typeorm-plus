import "reflect-metadata";
import {Category} from "./entity/Category";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";

describe("tree tables > nested-set", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Category]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("attach should work properly", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(a1);

        const a11 = new Category();
        a11.name = "a11";
        a11.parentCategory = a1;
        await categoryRepository.save(a11);

        const a111 = new Category();
        a111.name = "a111";
        a111.parentCategory = a11;
        await categoryRepository.save(a111);

        const a12 = new Category();
        a12.name = "a12";
        a12.parentCategory = a1;
        await categoryRepository.save(a12);

        const rootCategories = await categoryRepository.findRoots();
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.contain({ id: 1, name: "a1" });
        a11Parent.should.contain({ id: 2, name: "a11" });

        const a1Children = await categoryRepository.findDescendants(a1);
        a1Children.length.should.be.equal(4);
        a1Children.should.contain({ id: 1, name: "a1" });
        a1Children.should.contain({ id: 2, name: "a11" });
        a1Children.should.contain({ id: 3, name: "a111" });
        a1Children.should.contain({ id: 4, name: "a12" });
    })));

});
