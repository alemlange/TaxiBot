import TelegramBot from 'node-telegram-bot-api';
import {botCommands, botTexts, orderInfoText} from "./botCommands";
import {dateKeyboard,keyboards} from "./keyboards/keyboards"

export default class TaxiBot{
    // Token of the telegramBot
    #token;

    //Current bot UrlLocation
    #botUrl;

    //TelegramBotApi service
    #botApi;

    //Storage service
    #dbService;

    constructor(token, botUrl, storageClient){
        this.#token = token;

        this.#botUrl = botUrl;

        this.#botApi = new TelegramBot(this.#token);

        this.#dbService = storageClient;

        this.configureActions();
    }

    configureActions(){
        this.#botApi.on('text', msg => {

            if(!botCommands.includes(msg.text)){
                if(!/([01]\d|2[0-3]):?([0-5]\d)/.test(msg.text)){

                    this._setAddress(msg.chat.id, msg.text).catch((err) => {
                        console.log(err.message) ;

                        this._showError(msg.chat.id);
                    });
                }
            }
        });

        this.#botApi.onText(/\/start/, (msg) => {

            this._startBot(msg.chat.id).catch((err) => {
                console.log(err.message) ;

                this._showError(msg.chat.id);
            });
        });

        this.#botApi.onText(/Оставить заказ/, (msg) => {

            this._startOrder(msg.chat.id).catch((err) => {
                console.log(err.message) ;

                this._showError(msg.chat.id);
            });
        });

        this.#botApi.onText(/Мои заказы/, (msg) => {

            this._getMyOrders(msg.chat.id).catch((err) => {
                console.log(err.message) ;

                this._showError(msg.chat.id);
            });
        });

        this.#botApi.onText(/Отменить заказ/, (msg) => {

            this._cancelOrder(msg.chat.id).catch((err) => {
                console.log(err.message) ;

                this._showError(msg.chat.id);
            });
        });

        this.#botApi.onText(/([01]\d|2[0-3]):?([0-5]\d)/, (msg, match) => {

            this._setTime(msg.chat.id, match[0]).catch((err) => {
                console.log(err.message) ;

                this._showError(msg.chat.id);
            });
        });

        this.#botApi.on("callback_query", (msg) =>{

            let commandAndValue = msg.data.split('_');

            if(commandAndValue[0] === "date"){
                this._setOrderDate(msg, msg.data.split('_')[1]).catch((err) => {
                    console.log(err.message) ;

                    this._showError(msg.chat.id);
                });
            }
            else if(commandAndValue[0] === "complete"){
                this._postOrder(msg).catch((err) => {
                    console.log(err.message) ;

                    this._showError(msg.chat.id);
                });
            }

        });
    }

    _postOrder = async (msg) =>{
        let record = await this.#dbService.getActiveRecord(msg.from.id);

        if (record !== undefined){
            if(record.timeSet && record.arriveDate !== null && record.address !== null){
                await this.#dbService.postOrder(msg.from.id);

                this.#botApi.answerCallbackQuery(msg.id, botTexts.orderCallback);

                const orderInfo = "Заказ принят \n\n" + orderInfoText(record.dateStarted, record.arriveDate, record.address);
                await this.#botApi.editMessageText(orderInfo, {message_id: msg.message.message_id, chat_id: msg.from.id});

                await this.#botApi.sendMessage(msg.from.id, botTexts.orderComplete, keyboards.RK.startKeyBoard);
            }
            else{
                await this.#botApi.sendMessage(msg.from.id, botTexts.orderNotComplete);
            }
        }
        else{
            await this.#botApi.sendMessage(msg.from.id, botTexts.noActiveOrders, keyboards.RK.startKeyBoard);
        }
    };

    _setAddress = async (chatId, text)=>{
        let record = await this.#dbService.getActiveRecord(chatId);

        if (record !== undefined){
            if(record.timeSet && record.arriveDate !== null){
                if(record.address === null){
                    await this.#dbService.assignAddress(chatId, text);

                    const orderInfo = orderInfoText(record.dateStarted, record.arriveDate, text) +
                        "\n\n Чтобы отправить заказ нажмите на кнопку внизу.";
                    await this.#botApi.sendMessage(chatId, orderInfo, keyboards.IK.completeKeyBoard);
                }
                else{
                    await this.#botApi.sendMessage(chatId, botTexts.addressAlreadySet);
                }
            }
            else{
                await this.#botApi.sendMessage(chatId, botTexts.addressDateTimeNeeded);
            }
        }
        else{
            await this.#botApi.sendMessage(chatId, botTexts.noActiveOrders, keyboards.RK.startKeyBoard);
        }

    };

    _setTime = async(chatId, time) => {

        let record = await this.#dbService.getActiveRecord(chatId);

        if (record !== undefined){
            if(record.arriveDate !== null){
                if(!record.timeSet){

                    //parse time and write it into arriveDate field
                    let timeArray = time.split(':');
                    let oldDate = record.arriveDate;
                    let dateWithTime = new Date(oldDate.getFullYear(), oldDate.getMonth(),
                        oldDate.getDate(), timeArray[0], timeArray[1]);

                    //check if time is in the past
                    const now = new Date();
                    if(now < dateWithTime){

                        //write new arriving date in db and responce
                        await this.#dbService.assignDateAndTime(chatId, dateWithTime);
                        await this.#botApi.sendMessage(chatId, botTexts.timeResponce + time);

                        //go to address request
                        await this.#botApi.sendMessage(chatId, botTexts.addressRequest);
                    }
                    else{
                        await this.#botApi.sendMessage(chatId, botTexts.timeInThePast);
                    }
                }
                else{
                    await this.#botApi.sendMessage(chatId, botTexts.timeAlreadyChosen);
                }
            }
            else{
                await this.#botApi.sendMessage(chatId, botTexts.dateNeedToSet);
            }
        }
        else{
            await this.#botApi.sendMessage(chatId,  botTexts.noActiveOrders, keyboards.RK.startKeyBoard);
        }
    };

    _setOrderDate = async(msg, dateString) =>{

        let activeRecord = await this.#dbService.getActiveRecord(msg.from.id);

        if(activeRecord !== undefined){

            if(activeRecord.arriveDate === null){

                //Saving date of cab arriving into db
                const dateArray = dateString.split('/');
                let date = new Date(dateArray[2], dateArray[1] - 1, dateArray[0]);

                await this.#dbService.assignDate(msg.from.id, date);

                //Answering a callback and disposing of inline keyboard
                this.#botApi.answerCallbackQuery(msg.id, botTexts.dateCallback);
                await this.#botApi.editMessageText(botTexts.dateResponce + dateString, {message_id: msg.message.message_id, chat_id: msg.from.id});

                //now request time of arriving
                await this.#botApi.sendMessage(msg.from.id, botTexts.timeRequest);
            }
            else{
                await this.#botApi.sendMessage(msg.from.id, botTexts.dateAlreadyChosen);
            }
        }
        else{
            await this.#botApi.sendMessage(msg.from.id, botTexts.noActiveOrders, keyboards.RK.startKeyBoard);
        }

    };

    _startOrder = async(chatId) => {

        let activeRecords = await this.#dbService.getActiveRecord(chatId);

        if (activeRecords !== undefined){

            //If client already in the ordering process
            await this.#botApi.sendMessage(chatId, botTexts.orderAlreadyInAction, keyboards.RK.inActionKeyBoard);
        }
        else{

            //Creating new order
            let order = {chatId: chatId, status: "active", dateStarted: new Date(),
                address:null, arriveDate: null, timeSet: false };

            await this.#dbService.insertNewOrder(order);

            await this.#botApi.sendMessage(chatId, botTexts.startOrderInfo, keyboards.RK.inActionKeyBoard);

            //Requesting date of oredering a taxi
            await this.#botApi.sendMessage(chatId, botTexts.dateRequest, dateKeyboard());
        }
    };

    _getMyOrders = async(chatId)=>{
        let orders = await this.#dbService.getPostedRecords(chatId);

        if (orders !== undefined || orders.length !== 0){

            let ordersText = "Ваши заказы: \n";
            orders.forEach((order)=>{ ordersText =  ordersText +
                orderInfoText(order.dateStarted, order.arriveDate, order.address) +"\n\n"});

            await this.#botApi.sendMessage(chatId, ordersText);
        }
        else{
            await this.#botApi.sendMessage(chatId, botTexts.noPostedOrders);
        }
    };

    _cancelOrder = async(chatId) => {
        let activeRecords = await this.#dbService.getActiveRecord(chatId);

        if (activeRecords !== undefined){
            await this.#dbService.cancelOrder(chatId);
            await this.#botApi.sendMessage(chatId, botTexts.cancelOrder, keyboards.RK.startKeyBoard);
        }
        else{
            await this.#botApi.sendMessage(chatId, botTexts.cancelFailed, keyboards.RK.startKeyBoard);
        }
    };

    _startBot = async(chatId) =>{

        await this.#botApi.sendMessage( chatId, botTexts.startText, keyboards.RK.startKeyBoard);
    };

    _showError = async(chatId) =>{
        await this.#botApi.sendMessage( chatId, botTexts.errorOccured);
    };

    update(updateBody){
        this.#botApi.processUpdate(updateBody);
    }

    registerBot = async () => {

        try{
            await this.#botApi.setWebHook(this.#botUrl);
            return "WebHook set."
        }
        catch (e) {
            throw new Error ('Failed to setup WebHook, ' + e.message);
        }
    }
}