import express from 'express';
import TaxiBot from "../botLogic/TaxiBot";
import MongoBotClient from "../dbClients/MongoBotClient"
import {serverConfig} from "../config/serverConfig";
let router = express.Router();

const dbClient = new MongoBotClient(serverConfig.dbUrl, serverConfig.dbName);

const taxiBot = new TaxiBot(serverConfig.botToken,
    serverConfig.serverUrl + "/bot" + serverConfig.botToken,
    dbClient);

router.get('/start', function(req, res, next) {

  taxiBot.registerBot().then((data) => {
      res.send(data);
  }).catch((err)=>{
      res.send('Error occured ' + err.message);
  });
});

router.post('/bot' + serverConfig.botToken, function(req, res, next) {
    taxiBot.update(req.body);

    res.sendStatus(200);
});

export default router;