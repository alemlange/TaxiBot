import MongoBotClient from "../MongoBotClient"
import {serverConfig} from "../../config/serverConfig";

test('Create dbClient', () => {

    new MongoBotClient(serverConfig.dbUrl, serverConfig.dbName);
});

test('Check writing and canceling orders', async() => {

    const dbClient = new MongoBotClient(serverConfig.dbUrl, serverConfig.dbName);

    let order = {chatId: 1, status: "active", dateStarted: new Date(),
        address:null, arriveDate: null, timeSet: false };

    let resultInserting = await dbClient.insertNewOrder(order);

    let resultCanceling = await dbClient.cancelOrder(1);

    expect(resultInserting).toEqual("Ok");

    expect(resultCanceling).toEqual("Ok");
});

test('Check assigning date', async() => {

    const dbClient = new MongoBotClient(serverConfig.dbUrl, serverConfig.dbName);

    let dateToCheck = new Date();
    let order = {chatId: 1, status: "active", dateStarted: new Date(),
        address:null, arriveDate: dateToCheck, timeSet: false };

    let resultInserting = await dbClient.insertNewOrder(order);

    await dbClient.assignDate(1, dateToCheck);

    let record = await dbClient.getActiveRecord(1);

    let resultCanceling = await dbClient.cancelOrder(1);

    expect(resultInserting).toEqual("Ok");

    expect(resultCanceling).toEqual("Ok");

    expect(record.arriveDate).toEqual(dateToCheck);

});

test('Check assigning address', async() => {

    const dbClient = new MongoBotClient(serverConfig.dbUrl, serverConfig.dbName);

    let address = "адрес для проверки";
    let order = {chatId: 1, status: "active", dateStarted: new Date(),
        address:null, arriveDate: null, timeSet: false };

    let resultInserting = await dbClient.insertNewOrder(order);

    await dbClient.assignAddress(1, address);

    let record = await dbClient.getActiveRecord(1);

    let resultCanceling = await dbClient.cancelOrder(1);

    expect(resultInserting).toEqual("Ok");

    expect(resultCanceling).toEqual("Ok");

    expect(record.address).toEqual(address);

});

test('Check assigning date and time', async() => {

    const dbClient = new MongoBotClient(serverConfig.dbUrl, serverConfig.dbName);

    let dateToCheck = new Date();
    let order = {chatId: 1, status: "active", dateStarted: new Date(),
        address:null, arriveDate: dateToCheck, timeSet: false };

    let resultInserting = await dbClient.insertNewOrder(order);

    await dbClient.assignDateAndTime(1, dateToCheck);

    let record = await dbClient.getActiveRecord(1);

    let resultCanceling = await dbClient.cancelOrder(1);

    expect(resultInserting).toEqual("Ok");

    expect(resultCanceling).toEqual("Ok");

    expect(record.arriveDate).toEqual(dateToCheck);

    expect(record.timeSet).toEqual(true);

});
