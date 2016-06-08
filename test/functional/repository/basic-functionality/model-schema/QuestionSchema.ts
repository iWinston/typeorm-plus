export default {
    name: "Question",
    table: {
        name: "question"
    },
    columns: {
        id: {
            type: "int",
            primary: true,
            generated: true
        },
        title: {
            type: "string",
            nullable: false
        }
    },
    target: function Question() {
        this.type = "question";
    }
};