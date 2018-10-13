import { InlineKeyboard, ReplyKeyboard } from "node-telegram-keyboard-wrapper";

//Config Start keyboard
let startKeyBoard = new ReplyKeyboard();
startKeyBoard.addRow("Оставить заказ");
startKeyBoard.addRow("Мои заказы");

startKeyBoard = startKeyBoard.open();
startKeyBoard.reply_markup.resize_keyboard = true;

//Config keyboard for ordering
let inActionKeyBoard = new ReplyKeyboard();
inActionKeyBoard.addRow("Отменить заказ");

inActionKeyBoard = inActionKeyBoard.open();
inActionKeyBoard.reply_markup.resize_keyboard = true;

let completeKeyBoard = new InlineKeyboard();
completeKeyBoard.addRow({text:"Отправить заказ", callback_data:"complete"});
completeKeyBoard = completeKeyBoard.export();

export const keyboards={
    RK:{
        startKeyBoard: startKeyBoard,
        inActionKeyBoard: inActionKeyBoard
    },
    IK:{
        completeKeyBoard: completeKeyBoard
    }
};

export function dateKeyboard(){
    let weekKeyBoard = new InlineKeyboard();

    for(let i = 0; i < 7; i = i + 3 ){
        let first = new Date();
        first.setDate(first.getDate() + i);

        let second = new Date();
        second.setDate(second.getDate() + i + 1);

        let third = new Date();
        third.setDate(third.getDate() + i + 2);

        weekKeyBoard.addRow(
            {
                text: first.getDate() + "/" + (first.getMonth() + 1),
                callback_data: "date_" + first.getDate() + "/" + (first.getMonth() + 1) + "/" + first.getFullYear()
            },
            {
                text: second.getDate() + "/" + (second.getMonth() + 1),
                callback_data: "date_" + second.getDate() + "/" + (second.getMonth() + 1) + "/" + first.getFullYear()
            },
            {
                text: third.getDate() + "/" + (third.getMonth() + 1),
                callback_data: "date_" + third.getDate() + "/" + (third.getMonth() + 1) + "/" + first.getFullYear()
            });
    }

    return weekKeyBoard.export();
}