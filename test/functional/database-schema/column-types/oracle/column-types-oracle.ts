import "reflect-metadata";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {PostWithOptions} from "./entity/PostWithOptions";
import {PostWithoutTypes} from "./entity/PostWithoutTypes";
import {DateUtils} from "../../../../../src/util/DateUtils";

describe("database schema > column types > oracle", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["oracle"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it.only("all types should work correctly - persist and hydrate", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        await queryRunner.release();

        const post = new Post();
        post.id = 1;
        post.name = "Post";
        post.number = 32767;
        post.numeric = 32767;
        post.float = 10.53;
        post.dec = 100;
        post.decimal = 50;
        post.int = 2147483647;
        post.smallint = 32767;
        post.real = 10.5;
        post.doublePrecision = 15.35;
        post.char = "A";
        post.nchar = "A";
        post.varchar2 = "This is varchar2";
        post.nvarchar2 = "This is nvarchar2";
        post.long = "This is long";
        post.raw = new Buffer("This is raw");
        post.dateObj = new Date();
        post.date = "2017-06-21";
        post.timestamp = new Date();
        post.timestamp.setMilliseconds(0);
        post.timestampWithTimeZone = new Date();
        post.timestampWithTimeZone.setMilliseconds(0);
        post.timestampWithLocalTimeZone = new Date();
        post.timestampWithLocalTimeZone.setMilliseconds(0);
        post.blob = new Buffer("This is blob");
        post.clob = "This is clob";
        post.nclob = "This is nclob";
        post.simpleArray = ["A", "B", "C"];
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOne(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.number.should.be.equal(post.number);
        loadedPost.numeric.should.be.equal(post.numeric);
        loadedPost.float.should.be.equal(post.float);
        loadedPost.dec.should.be.equal(post.dec);
        loadedPost.decimal.should.be.equal(post.decimal);
        loadedPost.int.should.be.equal(post.int);
        loadedPost.smallint.should.be.equal(post.smallint);
        loadedPost.real.should.be.equal(post.real);
        loadedPost.doublePrecision.should.be.equal(post.doublePrecision);
        loadedPost.char.should.be.equal(post.char);
        loadedPost.nchar.should.be.equal(post.nchar);
        loadedPost.varchar2.should.be.equal(post.varchar2);
        loadedPost.nvarchar2.should.be.equal(post.nvarchar2);
        loadedPost.long.should.be.equal(post.long);
        loadedPost.raw.should.be.eql(post.raw);
        loadedPost.dateObj.should.be.equal(DateUtils.mixedDateToDateString(post.dateObj));
        loadedPost.date.should.be.equal(post.date);
        loadedPost.timestamp.valueOf().should.be.equal(post.timestamp.valueOf());
        loadedPost.timestampWithTimeZone.valueOf().should.be.equal(post.timestampWithTimeZone.valueOf());
        loadedPost.timestampWithLocalTimeZone.valueOf().should.be.equal(post.timestampWithLocalTimeZone.valueOf());
        loadedPost.blob.toString().should.be.equal(post.blob.toString());
        loadedPost.clob.toString().should.be.equal(post.clob.toString());
        loadedPost.nclob.toString().should.be.equal(post.nclob.toString());
        loadedPost.simpleArray[0].should.be.equal(post.simpleArray[0]);
        loadedPost.simpleArray[1].should.be.equal(post.simpleArray[1]);
        loadedPost.simpleArray[2].should.be.equal(post.simpleArray[2]);

        table!.findColumnByName("id")!.type.should.be.equal("number");
        table!.findColumnByName("name")!.type.should.be.equal("varchar2");
        table!.findColumnByName("name")!.length!.should.be.equal("255");
        table!.findColumnByName("number")!.type.should.be.equal("number");
        table!.findColumnByName("numeric")!.type.should.be.equal("number");
        table!.findColumnByName("float")!.type.should.be.equal("float");
        table!.findColumnByName("dec")!.type.should.be.equal("number");
        table!.findColumnByName("decimal")!.type.should.be.equal("number");
        table!.findColumnByName("int")!.type.should.be.equal("number");
        table!.findColumnByName("real")!.type.should.be.equal("float");
        table!.findColumnByName("smallint")!.type.should.be.equal("number");
        table!.findColumnByName("doublePrecision")!.type.should.be.equal("float");
        table!.findColumnByName("char")!.type.should.be.equal("char");
        table!.findColumnByName("char")!.length!.should.be.equal("1");
        table!.findColumnByName("nchar")!.type.should.be.equal("nchar");
        table!.findColumnByName("nchar")!.length!.should.be.equal("1");
        table!.findColumnByName("varchar2")!.type.should.be.equal("varchar2");
        table!.findColumnByName("varchar2")!.length!.should.be.equal("255");
        table!.findColumnByName("nvarchar2")!.type.should.be.equal("nvarchar2");
        table!.findColumnByName("nvarchar2")!.length!.should.be.equal("255");
        table!.findColumnByName("long")!.type.should.be.equal("long");
        table!.findColumnByName("raw")!.type.should.be.equal("raw");
        table!.findColumnByName("date")!.type.should.be.equal("date");
        table!.findColumnByName("dateObj")!.type.should.be.equal("date");
        table!.findColumnByName("timestamp")!.type.should.be.equal("timestamp");
        table!.findColumnByName("timestampWithTimeZone")!.type.should.be.equal("timestamp with time zone");
        table!.findColumnByName("timestampWithLocalTimeZone")!.type.should.be.equal("timestamp with local time zone");
        table!.findColumnByName("blob")!.type.should.be.equal("blob");
        table!.findColumnByName("clob")!.type.should.be.equal("clob");
        table!.findColumnByName("nclob")!.type.should.be.equal("nclob");
        table!.findColumnByName("simpleArray")!.type.should.be.equal("clob");

    })));

    it("all types should work correctly - persist and hydrate when options are specified on columns", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(PostWithOptions);
        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post_with_options");
        await queryRunner.release();

        const post = new PostWithOptions();
        post.id = 1;
        post.decimal = 50;
        post.dec = 60;
        post.numeric = 70;
        post.float = 5.25;
        post.char = "AAA";
        post.varchar = "This is varchar";
        post.nchar = "AAA";
        post.nvarchar = "This is nvarchar";
        post.binary = new Buffer("AAAAA");
        post.varbinary = new Buffer("BBBBB");
        post.datetime2 = new Date();
        post.time = new Date();
        post.datetimeoffset = new Date();
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOne(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.char.should.be.equal(post.char);
        loadedPost.varchar.should.be.equal(post.varchar);
        loadedPost.nchar.should.be.equal(post.nchar);
        loadedPost.nvarchar.should.be.equal(post.nvarchar);
        loadedPost.decimal.should.be.equal(post.decimal);
        loadedPost.dec.should.be.equal(post.dec);
        loadedPost.numeric.should.be.equal(post.numeric);
        loadedPost.float.should.be.equal(post.float);
        loadedPost.char.should.be.equal(post.char);
        loadedPost.varchar.should.be.equal(post.varchar);
        loadedPost.nchar.should.be.equal(post.nchar);
        loadedPost.nvarchar.should.be.equal(post.nvarchar);
        loadedPost.binary.toString().should.be.equal(post.binary.toString());
        loadedPost.varbinary.toString().should.be.equal(post.varbinary.toString());
        // commented because mssql inserted milliseconds are not always equal to what we say it to insert
        // commented to prevent CI failings
        // loadedPost.datetime2.getTime().should.be.equal(post.datetime2.getTime());
        // loadedPost.datetimeoffset.getTime().should.be.equal(post.datetimeoffset.getTime());
        loadedPost.time.should.be.equal(DateUtils.mixedTimeToString(post.time));

        table!.findColumnByName("id")!.type.should.be.equal("int");
        table!.findColumnByName("decimal")!.type.should.be.equal("decimal");
        table!.findColumnByName("decimal")!.precision!.should.be.equal(10);
        table!.findColumnByName("decimal")!.scale!.should.be.equal(5);
        table!.findColumnByName("dec")!.type.should.be.equal("decimal");
        table!.findColumnByName("dec")!.precision!.should.be.equal(10);
        table!.findColumnByName("dec")!.scale!.should.be.equal(5);
        table!.findColumnByName("numeric")!.type.should.be.equal("numeric");
        table!.findColumnByName("numeric")!.precision!.should.be.equal(10);
        table!.findColumnByName("numeric")!.scale!.should.be.equal(5);
        table!.findColumnByName("float")!.type.should.be.equal("real");
        table!.findColumnByName("float")!.precision!.should.be.equal(24);
        table!.findColumnByName("char")!.type.should.be.equal("char");
        table!.findColumnByName("char")!.length!.should.be.equal("3");
        table!.findColumnByName("varchar")!.type.should.be.equal("varchar");
        table!.findColumnByName("varchar")!.length!.should.be.equal("50");
        table!.findColumnByName("nchar")!.type.should.be.equal("nchar");
        table!.findColumnByName("nchar")!.length!.should.be.equal("3");
        table!.findColumnByName("nvarchar")!.type.should.be.equal("nvarchar");
        table!.findColumnByName("nvarchar")!.length!.should.be.equal("40");
        table!.findColumnByName("binary")!.type.should.be.equal("binary");
        table!.findColumnByName("binary")!.length!.should.be.equal("5");
        table!.findColumnByName("varbinary")!.type.should.be.equal("varbinary");
        table!.findColumnByName("varbinary")!.length!.should.be.equal("5");
        table!.findColumnByName("datetime2")!.type.should.be.equal("datetime2");
        table!.findColumnByName("datetime2")!.precision!.should.be.equal(5);
        table!.findColumnByName("time")!.type.should.be.equal("time");
        table!.findColumnByName("time")!.precision!.should.be.equal(6);
        table!.findColumnByName("datetimeoffset")!.type.should.be.equal("datetimeoffset");
        table!.findColumnByName("datetimeoffset")!.precision!.should.be.equal(7);

    })));

    it("all types should work correctly - persist and hydrate when types are not specified on columns", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(PostWithoutTypes);
        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post_without_types");
        await queryRunner.release();

        const post = new PostWithoutTypes();
        post.id = 1;
        post.name = "Post";
        post.bit = true;
        post.binary = new Buffer("A");
        post.datetime = new Date();
        post.datetime.setMilliseconds(0); // set milliseconds to zero because the SQL Server datetime type only has a 1/300 ms (~3.33̅ ms) resolution
        await postRepository.save(post);

        const loadedPost = (await postRepository.findOne(1))!;
        loadedPost.id.should.be.equal(post.id);
        loadedPost.name.should.be.equal(post.name);
        loadedPost.bit.should.be.equal(post.bit);
        loadedPost.binary.toString().should.be.equal(post.binary.toString());
        loadedPost.datetime.getTime().should.be.equal(post.datetime.getTime());

        table!.findColumnByName("id")!.type.should.be.equal("int");
        table!.findColumnByName("name")!.type.should.be.equal("nvarchar");
        table!.findColumnByName("name")!.length!.should.be.equal("255");
        table!.findColumnByName("bit")!.type.should.be.equal("bit");
        table!.findColumnByName("binary")!.type.should.be.equal("binary");
        table!.findColumnByName("binary")!.length!.should.be.equal("1");
        table!.findColumnByName("datetime")!.type.should.be.equal("datetime");

    })));

});
