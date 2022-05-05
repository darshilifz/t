// @ts-ignore
import http from "http";
import express, { RequestHandler} from 'express';
//import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { monitor } from "@colyseus/monitor";
const routes = require("./dbscripts/src/routes")
require('express-async-errors')

import { NotFoundError } from './dbscripts/src/errors/InstancesCE'
import { errorHandler } from './dbscripts/src/middlewares/errorhandler'

const userLinks = require("./dbscripts/src/routes/userRoutes");
const adminLinks = require('./dbscripts/src/routes/adminRoutes');
const fbLinks = require('./dbscripts/src/routes/fbuserRoutes');
const paymentLinks=require('./dbscripts/src/routes/paymentRoutes');
const adminPaymentLinks=require('./dbscripts/src/routes/adminPaymentRoutes');
// import socialRoutes from "@colyseus/social/express"

import { GameRoom } from "./src/GameRoom";
import {RoyalMarriage} from "./src/RM_Room"; 
import {RoyalThreeDifference} from "./src/RTD_Room"; 

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());

//app.use(express.json({}))
app.use(express.urlencoded({extended: true}) as RequestHandler); 
app.use(express.json() as RequestHandler);  
//app.use(express.json({1024*1024*50}));


const server = http.createServer(app);
const gameServer = new Server({
  server,
});

// register your room handlers
gameServer.define('ORG', GameRoom).filterBy(['maxClients']);
gameServer.define('RM', RoyalMarriage).filterBy(['maxClients']);
gameServer.define('RTD', RoyalThreeDifference).filterBy(['maxClients']);

//500
gameServer.define('ORG_500', GameRoom).filterBy(['maxClients']);
gameServer.define('RM_500', RoyalMarriage).filterBy(['maxClients']);
gameServer.define('RTD_500', RoyalThreeDifference).filterBy(['maxClients']);

//1000
gameServer.define('ORG_1000', GameRoom).filterBy(['maxClients']);
gameServer.define('RM_1000', RoyalMarriage).filterBy(['maxClients']);
gameServer.define('RTD_1000', RoyalThreeDifference).filterBy(['maxClients']);

//5000
gameServer.define('ORG_5000', GameRoom).filterBy(['maxClients']);
gameServer.define('RM_5000', RoyalMarriage).filterBy(['maxClients']);
gameServer.define('RTD_5000', RoyalThreeDifference).filterBy(['maxClients']);

//25000
gameServer.define('ORG_25000', GameRoom).filterBy(['maxClients']);
gameServer.define('RM_25000', RoyalMarriage).filterBy(['maxClients']);
gameServer.define('RTD0_25000', RoyalThreeDifference).filterBy(['maxClients']);

//50000
gameServer.define('ORG_50000', GameRoom).filterBy(['maxClients']);
gameServer.define('RM_50000', RoyalMarriage).filterBy(['maxClients']);
gameServer.define('RTD0_50000', RoyalThreeDifference).filterBy(['maxClients']);


// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());
// app.use('/api', require('./dbscripts/src/routes'))
// app.use('/api',routes.router);
app.use('/api/user',userLinks);
app.use('/api/admin', adminLinks);
app.use('/api/fb', fbLinks);
app.use('/api/userPayment',paymentLinks);
app.use('/api/adminPayment',adminPaymentLinks);

app.all('*', (req, res)=>{
  throw new NotFoundError('Path Not Found')
})

app.use(errorHandler);

process.on('unhandledRejection', (reason)=>{
  console.log(reason);
})

process.on('uncaughtException', (error)=>{
  console.log(error);
  process.exit(1)
  
})

gameServer.listen(port);
console.log(`Listening on ws://localhost:${ port }`)
