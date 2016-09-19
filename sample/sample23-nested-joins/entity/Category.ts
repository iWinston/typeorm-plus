import {GeneratedIdColumn, Column, Table} from "../../../src/index";
import {Author} from "./Author";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";

@Table("sample23_category")
export class Category {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;
    
    @ManyToMany(type => Author)
    @JoinTable()
    author: Author;

}