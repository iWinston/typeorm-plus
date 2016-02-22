import {TypeORM} from "../../src/TypeORM";
import {Post} from "./entity/Post";
import {PostDetails} from "./entity/PostDetails";
import {Image} from "./entity/Image";
import {ImageDetails} from "./entity/ImageDetails";
import {Cover} from "./entity/Cover";
import {Category} from "./entity/Category";

// first create a connection
let options = {
    host: "192.168.99.100",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    autoSchemaCreate: true
};

TypeORM.createMysqlConnection(options, [Post, PostDetails, Image, ImageDetails, Cover, Category]).then(connection => {

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
        .addSelect("category")
        .leftJoin("post.images", "image")
        .leftJoin("post.secondaryImages", "secondaryImage")
        .leftJoin("image.details", "imageDetails", "on", "imageDetails.meta=:meta")
        .innerJoin("post.cover", "cover")
        .leftJoin("post.categories", "category", "on", "category.description=:description")
        //.leftJoin(Image, "image", "on", "image.post=post.id")
        //.where("post.id=:id")
        .setParameter("id", 1)
        .setParameter("description", "cat2")
        .setParameter("meta", "sec image");
    
    return qb
        .getSingleResult()
        .then(result => console.log(JSON.stringify(result, null, 4)))
        .catch(error => console.log(error.stack ? error.stack : error));

    /*let details = new PostDetails();
    details.comment = "This is post about hello";
    details.meta = "about-hello";

    const post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    //post.details = details;

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));*/

}).catch(error => console.log(error.stack ? error.stack : error));