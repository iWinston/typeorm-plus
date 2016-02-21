import {TypeORM} from "../../src/TypeORM";
import {Post} from "./entity/Post";
import {PostDetails} from "./entity/PostDetails";
import {Image} from "./entity/Image";
import {ImageDetails} from "./entity/ImageDetails";
import {Cover} from "./entity/Cover";

// first create a connection
let options = {
    host: "192.168.99.100",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    autoSchemaCreate: true
};

TypeORM.createMysqlConnection(options, [Post, PostDetails, Image, ImageDetails, Cover]).then(connection => {

    const postJson = {
        id: 1,
        text: "This is post about hello",
        title: "hello",
        details: {
            id: 1,
            comment: "This is post about hello",
            meta: "about-hello"
        }
    };

    let postRepository = connection.getRepository<Post>(Post);
    let qb = postRepository
        .createQueryBuilder("post")
        .addSelect("image")
        .addSelect("imageDetails")
        .addSelect("secondaryImage")
        .addSelect("cover")
        .leftJoin("post.images", "image", "on", "image.post=post.id")
        .leftJoin("post.secondaryImages", "secondaryImage", "on", "secondaryImage.secondaryPost=post.id")
        .leftJoin("image.details", "imageDetails", "on", "imageDetails.id=image.details")
        .innerJoin("post.cover", "cover", "on", "cover.id=post.cover")
        //.leftJoin(Image, "image", "on", "image.post=post.id")
        //.where("post.id=:id")
        .setParameter("id", 1);
    
    return postRepository
        .queryMany(qb.getSql(), qb.generateAliasMap())
        .then(result => console.log(JSON.stringify(result, null, 4)))
        .catch(err => console.log(err));

    return;

    let details = new PostDetails();
    details.comment = "This is post about hello";
    details.meta = "about-hello";

    const post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    //post.details = details;

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}).catch(error => console.log("Cannot connect: ", error));