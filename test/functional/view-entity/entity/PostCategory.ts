import {Connection, SelectQueryBuilder} from "../../../../src";
import {ViewColumn} from "../../../../src/decorator/columns/ViewColumn";
import {ViewEntity} from "../../../../src/decorator/entity-view/ViewEntity";
import {Category} from "./Category";
import {Post} from "./Post";

// @ViewEntity({ expression: `
//     SELECT "post"."id" "id", "post"."name" AS "name", "category"."name" AS "categoryName"
//     FROM "post" "post"
//     LEFT JOIN "category" "category" ON "post"."categoryId" = "category"."id"
// `})
// @ViewEntity({ expression: `
//     SELECT \`post\`.\`id\` \`id\`, \`post\`.\`name\` AS \`name\`, \`category\`.\`name\` AS \`categoryName\`
//     FROM \`post\` \`post\`
//     LEFT JOIN \`category\` \`category\` ON \`post\`.\`categoryId\` = \`category\`.\`id\`
// `})
@ViewEntity({ expression: (connection: Connection) => new SelectQueryBuilder(connection)
        .select("post.id", "id")
        .addSelect("post.name", "name")
        .addSelect("category.name", "categoryName")
        .from(Post, "post")
        .leftJoin(Category, "category", "category.id = post.categoryId")
        .where("post.id = 1")
        .andWhere(`post.name = 'BMW'`)
})
export class PostCategory {

    @ViewColumn()
    id: number;

    @ViewColumn()
    name: string;

    @ViewColumn()
    categoryName: string;

}
