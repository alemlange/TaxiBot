import { InlineKeyboard, ReplyKeyboard } from "node-telegram-keyboard-wrapper";

const startKeyBoard = new ReplyKeyboard();
startKeyBoard.addRow("Оставить заказ");
startKeyBoard.addRow("Мои заказы");

const inActionKeyBoard = new ReplyKeyboard();
inActionKeyBoard.addRow("Отменить заказ");
//inActionKeyBoard.addRow("Отправить заказ");

export const keyboards={
    RK:{
        startKeyBoard: startKeyBoard,
        inActionKeyBoard: inActionKeyBoard
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
            { text: first.getDate() + "/" + (first.getMonth() + 1), callback_data: "date_" + first.getDate() + "/" + (first.getMonth() + 1)},
            { text: second.getDate() + "/" + (second.getMonth() + 1), callback_data: "date_" + second.getDate() + "/" + (second.getMonth() + 1)},
            { text: third.getDate() + "/" + (third.getMonth() + 1), callback_data: "date_" + third.getDate() + "/" + (third.getMonth() + 1)},);
    }

    return weekKeyBoard;
}