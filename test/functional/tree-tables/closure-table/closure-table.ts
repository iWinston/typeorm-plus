import "reflect-metadata";
import {Category} from "./entity/Category";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";

describe.only("tree tables > closure-table", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Category],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("categories should be attached via parent and saved properly", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(a1);

        const a11 = new Category();
        a11.name = "a11";
        a11.parentCategory = a1;
        await categoryRepository.save(a11);

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
        a11Parent.should.include({ id: 1, name: "a1" });
        a11Parent.should.include({ id: 2, name: "a11" });

        const a1Children = await categoryRepository.findDescendants(a1);
        a1Children.length.should.be.equal(3);
        a1Children.should.include({ id: 1, name: "a1" });
        a1Children.should.include({ id: 2, name: "a11" });
        a1Children.should.include({ id: 3, name: "a12" });
    })));

    it("categories should be attached via children and saved properly", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(a1);

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        a1.childCategories = [a11, a12];
        await categoryRepository.save(a1);

        const rootCategories = await categoryRepository.findRoots();
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.include({ id: 1, name: "a1" });
        a11Parent.should.include({ id: 2, name: "a11" });

        const a1Children = await categoryRepository.findDescendants(a1);
        a1Children.length.should.be.equal(3);
        a1Children.should.include({ id: 1, name: "a1" });
        a1Children.should.include({ id: 2, name: "a11" });
        a1Children.should.include({ id: 3, name: "a12" });
    })));

    it("categories should be attached via children and saved properly and everything must be saved in cascades", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(a1);

        const rootCategories = await categoryRepository.findRoots();
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.include({ id: 1, name: "a1" });
        a11Parent.should.include({ id: 2, name: "a11" });

        const a1Children = await categoryRepository.findDescendants(a1);
        const a1ChildrenNames = a1Children.map(child => child.name);
        a1ChildrenNames.length.should.be.equal(5);
        a1ChildrenNames.should.include("a1");
        a1ChildrenNames.should.include("a11");
        a1ChildrenNames.should.include("a12");
        a1ChildrenNames.should.include("a111");
        a1ChildrenNames.should.include("a112");
    })));

    it.skip("should work correctly when saving using parent category", () => Promise.all(connections.map(async connection => {
        // await categoryRepository.attach(a1, a11);

        /*const a1 = new Category();
        a1.name = "a1";

        const b1 = new Category();
        b1.name = "b1";

        const c1 = new Category();
        c1.name = "c1";

        const c11 = new Category();
        c11.name = "c11";

        const c12 = new Category();
        c12.name = "c12";

        c11.parentCategory = c1;
        c12.parentCategory = c1;

        // todo: this case is not working:
        // c1.childCategories = [c11, c12];

        await categoryRepository.save(a1);
        await categoryRepository.save(b1);
        await categoryRepository.save(c1);
        await categoryRepository.save(c11);
        await categoryRepository.save(c12);

        const roots = await categoryRepository.findRoots();
        roots.should.be.eql([
            {
                id: 1,
                name: "a1",
                level: 1
            },
            {
                id: 2,
                name: "b1",
                level: 1
            },
            {
                id: 3,
                name: "c1",
                level: 1
            },
        ]);

        const c1Tree = await categoryRepository.findDescendantsTree(c1);
        c1Tree.should.be.equal(c1);
        c1Tree!.should.be.eql({
            id: 3,
            name: "c1",
            level: 1,
            childCategories: [{
                id: 4,
                name: "c11",
                level: 2,
                childCategories: []
            }, {
                id: 5,
                name: "c12",
                level: 2,
                childCategories: []
            }]
        });*/

    })));

    it.skip("should work correctly when saving using children categories", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const b1 = new Category();
        b1.name = "b1";

        const c1 = new Category();
        c1.name = "c1";

        const c11 = new Category();
        c11.name = "c11";

        const c12 = new Category();
        c12.name = "c12";

        await categoryRepository.save(a1);
        await categoryRepository.save(b1);
        await categoryRepository.save(c1);

        c1.childCategories = [c11];
        await categoryRepository.save(c1);

        c1.childCategories.push(c12);
        await categoryRepository.save(c1);
        // await categoryRepository.save(c11);
        // await categoryRepository.save(c12);

        const roots = await categoryRepository.findRoots();
        roots.should.be.eql([
            {
                id: 1,
                name: "a1",
                level: 1
            },
            {
                id: 2,
                name: "b1",
                level: 1
            },
            {
                id: 3,
                name: "c1",
                level: 1
            },
        ]);

        const c1Tree = await categoryRepository.findDescendantsTree(c1);
        c1Tree.should.be.equal(c1);
        c1Tree!.should.be.eql({
            id: 3,
            name: "c1",
            level: 1,
            childCategories: [{
                id: 4,
                name: "c11",
                level: 2,
                childCategories: []
            }, {
                id: 5,
                name: "c12",
                level: 2,
                childCategories: []
            }]
        });

    })));

    it.skip("should be able to retrieve the whole tree", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);

        const a1 = new Category();
        a1.name = "a1";

        const b1 = new Category();
        b1.name = "b1";

        const c1 = new Category();
        c1.name = "c1";

        const c11 = new Category();
        c11.name = "c11";

        const c12 = new Category();
        c12.name = "c12";

        await categoryRepository.save(a1);
        await categoryRepository.save(b1);
        await categoryRepository.save(c1);

        c1.childCategories = [c11];
        await categoryRepository.save(c1);

        c1.childCategories.push(c12);
        await categoryRepository.save(c1);

        const tree = await categoryRepository.findTrees();
        tree!.should.be.eql(
            [
                {
                    id: 1,
                    name: "a1",
                    level: 1,
                    childCategories: []
                },
                {
                    id: 2,
                    name: "b1",
                    level: 1,
                    childCategories: []
                },
                {
                    id: 3,
                    name: "c1",
                    level: 1,
                    childCategories: [{
                        id: 4,
                        name: "c11",
                        level: 2,
                        childCategories: []
                    }, {
                        id: 5,
                        name: "c12",
                        level: 2,
                        childCategories: []
                    }]
                }
            ]);

    })));


});
