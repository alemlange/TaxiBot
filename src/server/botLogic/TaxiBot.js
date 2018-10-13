import TelegramBot from 'node-telegram-bot-api';
import {botCommands} from "./botCommands";
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

                    this._setAddress(msg, msg.text);
                }
            }
        });

        this.#botApi.onText(/\/start/, (msg, match) => {

            this.#botApi.sendMessage( msg.from.id, "Добро пожаловать.", keyboards.RK.startKeyBoard);
        });

        this.#botApi.onText(/Оставить заказ/, (msg, match) => {

            this._startOrder(msg);
        });

        this.#botApi.onText(/Мои заказы/, (msg, match) => {

            this._getMyOrders(msg);
        });

        this.#botApi.onText(/Отменить заказ/, (msg, match) => {

            this._cancelOrder(msg);
        });

        this.#botApi.onText(/([01]\d|2[0-3]):?([0-5]\d)/, (msg, match) => {

            this._setTime(msg, match[0]);
        });

        this.#botApi.on("callback_query", (msg) =>{

            let commandAndValue = msg.data.split('_');

            if(commandAndValue[0] === "date"){
                this._setOrderDate(msg, msg.data.split('_')[1])
            }
            else if(commandAndValue[0] === "complete"){
                this._postOrder(msg);
            }

        });
    }

    _postOrder = async (msg) =>{
        let record = await this.#dbService.getActiveRecord(msg.from.id);

        if (record !== undefined){
            if(record.timeSet && record.arriveDate !== null && record.address !== null){
                await this.#dbService.postOrder(msg.from.id);

                this.#botApi.sendMessage(msg.from.id, 'Заказ получен, машина приедет точно всрок', keyboards.RK.startKeyBoard);
            }
            else{
                this.#botApi.sendMessage(msg.from.id, 'Сначала нужно указать дату и время прибытия машины и адрес.');
            }
        }
        else{
            this.#botApi.sendMessage(msg.from.id, 'У вас нет активных заказов.', keyboards.RK.startKeyBoard);
        }
    };

    _setAddress = async (msg, text)=>{
        let record = await this.#dbService.getActiveRecord(msg.chat.id);

        if (record !== undefined){
            if(record.timeSet && record.arriveDate !== null){
                await this.#dbService.assignAddress(msg.chat.id, text);

                this.#botApi.sendMessage(msg.chat.id, 'Адрес получен.', keyboards.IK.completeKeyBoard);
            }
            else{
                this.#botApi.sendMessage(msg.chat.id, 'Сначала нужно указать дату и время прибытия машины.');
            }
        }
        else{
            this.#botApi.sendMessage(msg.chat.id, 'У вас нет активных заказов.', keyboards.RK.startKeyBoard);
        }

    };

    _setTime = async(msg, time) => {

        let record = await this.#dbService.getActiveRecord(msg.chat.id);

        if (record !== undefined){
            if(record.arriveDate !== null){
                if(!record.timeSet){
                    let now = new Date();

                    let timeArray = time.split(':');

                    let oldDate = record.arriveDate;

                    let dateWithTime = new Date(oldDate.getFullYear(), oldDate.getMonth(),
                        oldDate.getDate(), timeArray[0], timeArray[1]);

                    if(now < dateWithTime){
                        await this.#dbService.assignDateAndTime(msg.from.id, dateWithTime);
                        this.#botApi.sendMessage(msg.chat.id, 'Машина приедет в ' + time);

                        this.#botApi.sendMessage(msg.chat.id, 'Введите адрес ');
                    }
                    else{
                        this.#botApi.sendMessage(msg.chat.id, 'Не можем прислать машину в прошлое');
                    }
                }
                else{
                    this.#botApi.sendMessage(msg.chat.id, 'Вы уже указали время');
                }
            }
            else{
                this.#botApi.sendMessage(msg.chat.id, 'Сначала нужно выбрать дату.');
            }
        }
        else{
            this.#botApi.sendMessage(msg.chat.id, 'У вас нет активных заказов.', keyboards.RK.startKeyBoard);
        }
    };

    _setOrderDate = async(msg, dateString) =>{

        let activeRecord = await this.#dbService.getActiveRecord(msg.from.id);

        if(activeRecord !== undefined){

            if(activeRecord.arriveDate === null){

                const dateArray = dateString.split('/');

                let date = new Date(dateArray[2], dateArray[1] - 1, dateArray[0]);

                await this.#dbService.assignDate(msg.from.id, date);

                this.#botApi.editMessageText("Вы выбрали: " + dateString, {message_id: msg.message.message_id, chat_id: msg.from.id});

                this.#botApi.answerCallbackQuery(msg.id, 'Вы выбрали: '+ dateString);

                this.#botApi.sendMessage(msg.from.id, 'Выберите время прибытия:');
            }
            else{
                this.#botApi.sendMessage(msg.from.id, 'Вы уже выбрали время прибытия');
            }

        }
        else{
            this.#botApi.sendMessage(msg.from.id, 'У вас нет активных заказов.', keyboards.RK.startKeyBoard);
        }

    };

    _startOrder = async(msg) => {

        let activeRecords = await this.#dbService.getActiveRecord(msg.chat.id);

        if (activeRecords !== undefined){
            this.#botApi.sendMessage(msg.chat.id, 'Вы уже в процессе заказа.', keyboards.RK.inActionKeyBoard);
        }
        else{
            let order = {chatId: msg.from.id, status: "active", dateStarted: new Date(),
                address:null, arriveDate: null, timeSet: false };

            await this.#dbService.insertNewOrder(order);

            this.#botApi.sendMessage(msg.chat.id, 'Для заказа заполните форму:', keyboards.RK.inActionKeyBoard);
            this.#botApi.sendMessage(msg.chat.id, 'Ваш заказ на:', dateKeyboard());
        }
    };

    _getMyOrders = async(msg)=>{
        let orders = await this.#dbService.getPostedRecords(msg.chat.id);

        if (orders !== undefined || orders.length !== 0){

            let messageText = "Ваши заказы: ";
            orders.forEach((order)=>{ messageText =  messageText + order.address});
            this.#botApi.sendMessage(msg.chat.id, messageText);
        }
        else{
            this.#botApi.sendMessage(msg.chat.id, "У вас пока нет совершенных заказов");
        }
    };

    _cancelOrder = async(msg) => {
        let activeRecords = await this.#dbService.getActiveRecord(msg.chat.id);

        if (activeRecords !== undefined){
            await this.#dbService.cancelOrder(msg.chat.id);
            this.#botApi.sendMessage(msg.chat.id, 'Заказ отменен.', keyboards.RK.startKeyBoard);
        }
        else{
            this.#botApi.sendMessage(msg.chat.id, 'Нечего отменять.', keyboards.RK.startKeyBoard);
        }
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