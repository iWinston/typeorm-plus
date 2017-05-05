import "reflect-metadata";
import {Post} from "./entity/Post";
import {ContentModule} from "./entity/ContentModule";
import {Unit} from "./entity/Unit";
import {MetadataArgsUtils} from "../../../../src/metadata-args/MetadataArgsUtils";

describe("metadata builder > MetadataArgsUtils", () => {

    it("getInheritanceTree", () => {
        const inheritanceTree = MetadataArgsUtils.getInheritanceTree(Post);
        inheritanceTree.should.be.eql([
            Post,
            ContentModule,
            Unit,
        ]);
    });

    it("filterByTargetClasses", () => {
        MetadataArgsUtils.filterByTargetClasses([
            { },
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: Post },
            { target: ContentModule },
            { target: Unit },
        ], [Post, Unit]).should.be.eql([
            { target: Post },
            { target: Unit },
        ]);

        MetadataArgsUtils.filterByTargetClasses([
            { },
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: ContentModule },
            { target: Unit },
        ], [Post, Unit]).should.be.eql([
            { target: Unit },
        ]);

        MetadataArgsUtils.filterByTargetClasses([
            { },
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: ContentModule },
            { target: Post },
            { target: Unit },
        ], [Post, Unit, ContentModule]).should.be.eql([
            { target: ContentModule },
            { target: Post },
            { target: Unit },
        ]);

        MetadataArgsUtils.filterByTargetClasses([
        ], [Post, Unit, ContentModule]).should.be.eql([
        ]);

        MetadataArgsUtils.filterByTargetClasses([
            { },
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: ContentModule },
            { target: Post },
            { target: Unit },
        ]).should.be.eql([
            { },
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: ContentModule },
            { target: Post },
            { target: Unit },
        ]);
    });

});