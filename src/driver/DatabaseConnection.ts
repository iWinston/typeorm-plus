export interface DatabaseConnection {

    id: number;
    connection: any;
    isTransactionActive: boolean;
    releaseCallback?: Function;

}