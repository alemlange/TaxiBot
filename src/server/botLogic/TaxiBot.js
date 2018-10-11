import TelegramBot from 'node-telegram-bot-api';
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
        /*this.#botApi.on('message', msg => {
            this.#botApi.sendMessage(msg.chat.id, 'I am alive!');
        });*/

        this.#botApi.onText(/\/start/, (msg, match) => {

            this.#botApi.sendMessage( msg.from.id, "Добро пожаловать.", keyboards.RK.startKeyBoard.open());
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

        this.#botApi.on("callback_query", (msg) =>{
            let dateString = msg.data.split('_')[1];

            this.#botApi.editMessageText("Вы выбрали: " + dateString, {message_id: msg.message.message_id, chat_id: msg.from.id});

            //this.#botApi.answerCallbackQuery(msg.id, 'Вы выбрали: '+ dateString);

        });
    }

    _startOrder = async(msg) => {

        let activeRecords = await this.#dbService.getActiveRecord(msg.chat.id);

        const actionKeyBoard = keyboards.RK.inActionKeyBoard.open();
        actionKeyBoard.reply_markup.resize_keyboard = true;

        if (activeRecords !== undefined){
            this.#botApi.sendMessage(msg.chat.id, 'Вы уже в процессе заказа.', actionKeyBoard);
        }
        else{
            let order = {chatId: msg.from.id, status: "active", dateStarted: new Date(),
                address:null, arriveDate: null, arriveTime: null };

            await this.#dbService.insertNewOrder(order);

            this.#botApi.sendMessage(msg.chat.id, 'Для заказа заполните форму:', actionKeyBoard);
            this.#botApi.sendMessage(msg.chat.id, 'Ваш заказ на:', dateKeyboard().export());
        }

    };

    _getMyOrders(msg){
        this.#dbService.getActiveRecord(msg.chat.id).then( (record) =>{
            if (record !== undefined){
                this.#botApi.sendMessage(msg.chat.id, 'Ваш заказ: на' + record.address + record.dateStarted.toString());
            }
        })
    };

    _cancelOrder = async(msg) => {
        let activeRecords = await this.#dbService.getActiveRecord(msg.chat.id);

        const startKeyboard = keyboards.RK.startKeyBoard.open();
        startKeyboard.reply_markup.resize_keyboard = true;

        if (activeRecords !== undefined){
            await this.#dbService.cancelOrder(msg.chat.id);
            this.#botApi.sendMessage(msg.chat.id, 'Заказ отменен.', startKeyboard);
        }
        else{
            this.#botApi.sendMessage(msg.chat.id, 'Нечего отменять.', startKeyboard);
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