import mongodb from 'mongodb';

export default class MongoBotClient {

    #dbUrl = "";

    #dbName = "";

    constructor(dbUrl, dbName){
        this.#dbUrl = dbUrl;
        this.#dbName = dbName;
    }

    getActiveRecord = async(chatId) => {

        const client = mongodb.MongoClient(this.#dbUrl, { useNewUrlParser: true });
        await client.connect();
        const db = client.db(this.#dbName);

        try {
            let orders = await db.collection("TaxiOrders").find({chatId: chatId, status:"active"}).limit(1).toArray();

            return orders[0];
        } catch (err) {
            console.log(err.stack);
        }
        finally{
            client.close();
        }

    };

    getPostedRecords = async(chatId) => {

        const client = mongodb.MongoClient(this.#dbUrl, { useNewUrlParser: true });
        await client.connect();
        const db = client.db(this.#dbName);

        try {
            return await db.collection("TaxiOrders").find({chatId: chatId, status:"posted"}).limit(5).toArray();

        } catch (err) {
            console.log(err.stack);
        }
        finally{
            client.close();
        }

    };

    postOrder = async(chatId) =>{

        const client = mongodb.MongoClient(this.#dbUrl, { useNewUrlParser: true });
        await client.connect();
        const db = client.db(this.#dbName);

        try{
            await db.collection("TaxiOrders").updateOne({chatId: chatId, status:"active"}, {$set: {status: "posted"}});
        }
        finally {
            client.close();
        }
    };

    assignAddress = async(chatId, address) =>{

        const client = mongodb.MongoClient(this.#dbUrl, { useNewUrlParser: true });
        await client.connect();
        const db = client.db(this.#dbName);

        try{
            await db.collection("TaxiOrders").updateOne({chatId: chatId, status:"active"}, {$set: {address: address}});
        }
        finally {
            client.close();
        }
    };

    assignDate = async(chatId, date) => {

        const client = mongodb.MongoClient(this.#dbUrl, { useNewUrlParser: true });
        await client.connect();
        const db = client.db(this.#dbName);

        try{
            await db.collection("TaxiOrders").updateOne({chatId: chatId, status:"active", arriveDate: null}, {$set: {arriveDate: date}});
        }
        finally {
            client.close();
        }
    };

    assignDateAndTime = async(chatId, date) => {

        const client = mongodb.MongoClient(this.#dbUrl, { useNewUrlParser: true });
        await client.connect();
        const db = client.db(this.#dbName);

        try{
            await db.collection("TaxiOrders").updateOne({chatId: chatId, status:"active"}, {$set: {arriveDate: date, timeSet: true}});
        }
        finally {
            client.close();
        }

    };

    insertNewOrder = async(record) => {
        const client = mongodb.MongoClient(this.#dbUrl, { useNewUrlParser: true });
        await client.connect();
        const db = client.db(this.#dbName);

        try{
            await db.collection("TaxiOrders").insertOne(record);
        }
        finally {
            client.close();
        }
    };

    cancelOrder = async(chatId) =>{
        const client = mongodb.MongoClient(this.#dbUrl, { useNewUrlParser: true });
        await client.connect();
        const db = client.db(this.#dbName);

        try{
            await db.collection("TaxiOrders").updateOne({chatId: chatId, status:"active"}, {$set: {status: "canceled"}});
        }
        finally {
            client.close();
        }
    }
}