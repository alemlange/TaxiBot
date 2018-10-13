export const botCommands = ["/start","Оставить заказ","Мои заказы","Отменить заказ"];

export const botTexts ={

    errorOccured: "Упс, произошла ошибка в боте.",

    orderAlreadyInAction:"Вы уже в процессе заказа.",

    noActiveOrders:"У вас пока нет активных заказов. Чтобы начать заказ нажмите 'Оставить заказ'.",

    noPostedOrders:"У вас пока нет совершенных заказов.",

    startText: "Привет, я бот который умеет принимать заказы такси. " +
        "Для того чтобы заказть такси нажмите кнопку на клавиатуре 'Оставить заказ'",

    startOrderInfo:"Для того чтобы оставить заявку на вызов такси, потребуется в несколько шагов указать дату, " +
        "время и адрес подачи машины. Начнем с даты...",

    dateRequest:"Выберите дату на которую вы хотите вызвать такси из предложенных внизу.",

    dateResponce:"Хорошо, машина приедет ",

    dateAlreadyChosen:"Вы уже выбрали дату подачи.",

    dateNeedToSet:"Сначала нужно выбрать дату подачи.",

    dateCallback:"Дата подачи машины получена.",

    timeRequest:"Теперь пришлите мне время подачи машины в формате ЧЧ:ММ. Например 14:30.",

    timeAlreadyChosen:"Вы уже выбрали время прибытия.",

    timeInThePast:"К сожалению мы не можем прислать машину в прошлое. Пришлите другое время.",

    timeResponce: "Принято, машина приедет в",

    addressRequest:"Теперь осталось только прислать мне адрес подачи машины: ",

    addressAlreadySet: "Вы уже указали адрес подачи машины.",

    addressDateTimeNeeded:"Сначала нужно указать дату и время подачи машины.",

    orderCallback:"Заказ принят.",

    orderComplete: "Заказ получен, машина приедет точно в срок.",

    orderNotComplete: "Сначала нужно указать дату и время прибытия машины и адрес.",

    cancelOrder: "Заказ отменен.",

    cancelFailed: "Нечего отменять."

};

export function orderInfoText(orderStarted, orderDate, orderAddress){
    let info = "Заказ от " + orderStarted.toLocaleDateString('ru-RU')+"\n";

    info += "Машина заказана на " + orderDate.toLocaleDateString('ru-RU')
        + " в " + orderDate.getHours()+":" + orderDate.getMinutes() + "\n";

    info += "По адресу: " + orderAddress;

    return info;
}