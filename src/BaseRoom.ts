import { Room, Client, SchemaSerializer, Delayed } from 'colyseus';
import { MapSchema, ArraySchema } from '@colyseus/schema';
import { GameState, Player, Card } from './State';
import { CardUtils } from './utils/CardUtils';
import { PlayerUtils } from './utils/PlayerUtils';
import { GameConfig } from './GameConfig';
import { Seatingstatus } from './Seatingstatus';
import { metadata } from './metadata';
import { DbUtils } from "../dbscripts/src/utils/DbUtils";
import { User_Profile } from '../dbscripts/src/entity/User_Profile';
import { Wallet } from '../dbscripts/src/entity/Wallet';
import { Lobby } from '../dbscripts/src/entity/Lobby';
import { Lobby_Commision } from '../dbscripts/src/entity/Lobby_Commision';
import { Club } from '../dbscripts/src/entity/Club';
import { Variation } from '../dbscripts/src/entity/Variation';
import { Lobby_History } from '../dbscripts/src/entity/Lobby_History';
import {Admin} from "../dbscripts/src/entity/Admin";
const routes = require('../dbscripts/src/routes');

export class BaseRoom extends Room<GameState> {
    playerCount: number = 0; //Tracks the number of players in the room

    SeatingCount: number = 0;

    maxPlayer: number; //Maximum Player in the room

    // blindMade: boolean = true; //Track and limit the Raise made in a phase to the config value

    pokerConfig: GameConfig; //Config based on pokerType

    playerUtils: PlayerUtils = new PlayerUtils(); //Utilities for Players

    cardUtils: CardUtils = new CardUtils(); //Utilities for Cards

    delayedInterval: Delayed;
    
    delayedTimeout: Delayed;

    sideshowPlayers: MapSchema<Player> = new MapSchema<Player>(); //players details who made side-show

    deck: Array<Card> = new Array<Card>();

    CurrentSeattingArrange: Array<number> = new Array<number>();

    Current_player_count: number;

    IsslideShowrun: boolean;

    Round: number = 0;
    //Create the Room
    onCreate(options: any) {
        // console.log("Hi");
        this.setState(new GameState());
        for (let i = 0; i < 9; i++) {
            this.state.Seatting.push(new Seatingstatus());
        }
        // console.log(this.state.Seatting);

        console.log(`Room ${this.roomName} created with roomId ${this.roomId}`);

        //Setup Helper class objects
        if (options.Customoptions.club_ID != -1) {
            this.autoDispose = false;
        }
        else {
            this.autoDispose = true;
        }

        //Set state
        this.pokerConfig = new GameConfig();
        this.pokerConfig.setupConfig(options);
        console.log(options);
        
        this.maxClients = options.maxClients;
        this.maxPlayer = options.maxClients;

        this.pokerConfig.maxPotLimit = options.Customoptions.maxPotLimit;
        this.pokerConfig.maxBetLimit = options.Customoptions.maxBet;
        this.pokerConfig.minBet = options.Customoptions.bootAmount;
        this.pokerConfig.table_Max_Amount = options.Customoptions.maxBet;

        this.state.minBet = this.pokerConfig.minBet;
        this.Adding_data_To_Lobby(options.Customoptions);
        //Set the lobby id and over here if it is lobby

        //Set message handlers
        this.initializeMessageHandlers();
    }

    //New Player Joins the Room
    onJoin(client: Client, options: any) {
        console.log(
            `Server: Client joined with id ${client.id} and sessionId ${client.sessionId}`
        );

        var counter: number = 0;

        // console.log(this.state.Seatting);
        //Create a new player and add to MapSchema
        let newplayer: Player = this.addPlayer(client.sessionId, client);
        newplayer.Player_name = options.User.user_name;
        newplayer.User_Id = options.User.user_id;

        let a = this.Get_Wallet_Amount(newplayer.User_Id);
        a.then(value => {
            newplayer.User_Table_Amount = value;
        });

        console.log(options);

        this.state.players.set( client.sessionId,newplayer);

        if (this.clients.length == this.maxClients) {
            console.log(`${this.roomId} Room Locked!!`);
            this.lock();
        }

        this.Sending_Image(client).then(r => console.log());

    }

    // //Existing Player Leaves the Room
    async onLeave(client: Client, consented: boolean) {
        console.log(
            `Server: Client left with id ${client.id} and sessionId ${client.sessionId}`
        );
        try {
            // If consented, remove without wait
            if (consented) {
                this.removePlayer(client, true);
            }
            else {
                this.removePlayer(client, true);
            }
        } catch (e) {
            console.log(`Player has not reconnected, removing from Room`);
            this.removePlayer(client, true);
        }
        if (this.clients.length < this.pokerConfig.minPlayers) {
            this.unlock();
        }
    }

    //Destroy the Room
    onDispose() {
        console.log(this.state.Lobby_id);
        routes.Disposing_lobby(this.state.Lobby_id);
        // disposing_lobby(this.state.Lobby_id);
        console.log(`${this.roomName} Room with id ${this.roomId} Disposed!!`);
    }

    //Initialize all the message handler to be handled from Client
    initializeMessageHandlers() {
        //Message that the player is SitDown on that table
        this.onMessage(`SitDown`, (client, message) => {
            console.log(client.sessionId + " " + message);
            this.OnMsg_Sitdown(client,message);
        });

        // This will call when the player will standup from the table
        this.onMessage('Standup', (client, message) => {
            this.removePlayer(client, false);
        });


        // This will call when the player will call when the player want to see the cards
        this.onMessage("See", (client, message) => {
            this.OnMsg_See(client,message);
        });

        // This will call when the player give a show 
        this.onMessage("Show", (client, message) => {
            //in show rasie is not allowed 
            console.log("Pot : " + this.state.pot);
            // console.log("Max Pot : " + this.pokerConfig.maxPotLimit);
            this.OnMsg_Show(client);
        });

        //Message from client when makes a BLIND
        this.onMessage(`blind`, (client, message) => {
            this.OnMsg_Blind(client, message);
        });

        //Message from client when makes a CHAAL
        this.onMessage(`chaal`, (client, message) => {
            console.log("Pot : " + this.state.pot);
            console.log("chaal::" + this.state.players[client.sessionId]);
            this.OnMsg_Chaal(client, message);
        });

        //Message from client when makes a PACK
        this.onMessage(`pack`, (client, message) => {
            // this.clock.clear();
            this.OnMsg_Pack(client, message);
        });

        //Message from client when made side-show
        this.onMessage(`sideshow`, (client, message) => {
            this.OnMsg_SideShow(client, message);
        });
        //#endregion       

        this.onMessage(`SideShow_request`, (client, message) => {
            this.OnMsg_SSRequest(client, message);
        });
    }

    OnMsg_Sitdown(client:Client,message:any){
        if (this.state.Seatting[message].Session_id == "-1") {
            let player = this.state.players.get(client.id);
            player.Seatnumber = message;

            let seatingstatus :Seatingstatus = new Seatingstatus();
            seatingstatus.Setvalue(client.id , false);

            this.state.Seatting[message] = seatingstatus;
            this.SeatingCount++;
            console.log("-=-=-=-=-SeatingCount=-=-=-=>");
            //console.log(this.state.Seating);
            player.totalChips = player.User_Table_Amount;

            if (!this.state.isGameRunning && this.SeatingCount <= 2) {
                this.Startgame_TimerReset();
            }
            this.Sending_Image(client, true).then(r => console.log());

        }
        else {
            console.log("Seat is already taken");
        }
    }

    OnMsg_See(client:Client,message:any){
        let player = this.state.players.get(client.id);
        player.isBlind = false;
        client.send("See", player);
        this.broadcast("actions", { seat: player.Seatnumber.toString(), action: "See", totalchips: player.totalChips.toString() });

        //console.log("-=-=-=-=>" + JSON.stringify(this.state.players));
        let count: number = 1;
        let next_ins: number = player.Seatnumber;
        if (!this.state.IsShowPossible) {
            if (player.Seatnumber == this.state.activePlayerIndex) {
                if (this.Check_For_SlideShow(player) != -1) {

                    // console.log("this SideShow_Request");
                    client.send(`Enable_SideShow`);
                }
            }
            while (count <= this.state.Seatting.length) {
                next_ins += 1;
                if (next_ins == 9) {
                    next_ins = 0;
                }
                console.log("next_ins" + next_ins);
                if (this.state.Seatting[next_ins].Session_id != "-1"
                    && !this.state.players.get(this.state.Seatting[next_ins].Session_id).IsPack) {
                    if (!this.state.players.get(this.state.Seatting[next_ins].Session_id).isBlind) {
                        if (this.state.activePlayerIndex == next_ins) {
                            this.state.players.get(this.state.Seatting[this.state.activePlayerIndex].Session_id).IsSS = true;
                            for (let key in this.clients) {
                                if (this.clients[key].id == this.state.Seatting[next_ins].Session_id) {
                                    console.log("this SideShow_Request");
                                    this.clients[key].send(`Enable_SideShow`);
                                }
                            }
                        }
                    }
                    break;
                }
                count++;
            }
        }
    }

    OnMsg_Show(client: Client) {
        for (let i = 0; i < this.state.Seatting.length; i++) {
            let player: Player = this.state.players.get(this.state.Seatting[i].Session_id);
            if (this.state.Seatting[i].Session_id != "-1" && this.state.Seatting[i].Is_Playing && player.isBlind) {
                player.replacedCards = player.cards.clone();
                // console.log(JSON.stringify(this.state.players[this.state.Seatting[i].Session_id].replacedCards));

                // console.log("SHOW: " + JSON.stringify(this.state.players));
            }
        }

        let player: Player = this.state.players[client.id];

        if (player.isBlind) {
            player.currentBet = this.state.currentBetBlind;
        }
        else {
            player.currentBet = this.state.currentBetChaal;
        }
        player.totalChips -= player.currentBet;

        player.blindsPerGame = 3;
        player.isBlind = false;
        player.totalBet += player.currentBet;

        this.broadcast("actions", { seat: player.Seatnumber.toString(), action: "Show", totalchips: player.totalChips.toString() });

        console.log(`Current active player current bet is ${player.currentBet}`);
        console.log(`Current active player total bet is ${player.totalBet}`);

        this.state.pot += player.currentBet;

        //  this.check_Packed_player(message.activePlayerIndex);

        // client.send(`message`, `${this.state.players[message.activePlayerIndex].id} played chaal`);
        console.log(`Current active player pot is ${player.totalChips}`);

        console.log("-=-=-=-=-=this.state.players-=-=-=-=-=-=->");
        console.log(this.state.players);

        //Move to next step or Next Player
        this.moveToNextPhase(`show`);
    }

    OnMsg_Blind(client: Client, message: any) {
        let client_id: string = this.state.Seatting[message.activePlayerIndex].Session_id;
        console.log("blind::" + JSON.stringify(this.state.players[client_id]));

        let player: Player = this.state.players.get(client.id);
        if (player.blindsPerGame === this.pokerConfig.maxBlind
            && player.isBlind) {
            // console.log(`Please see the cards!`);
            player.isBlind = false;
            client.send("See", player)
        }
        else {
            let player: Player = this.state.players.get(client_id);

            if (message.isRaise) {
                if (player.totalChips < this.state.currentBetBlind * 2) {
                    return;
                }
                this.state.currentBetBlind = this.state.currentBetBlind * 2;
                this.state.currentBetChaal = this.state.currentBetBlind * 2;
                console.log("IsRaise" + this.state.currentBetBlind + " " + this.state.currentBetChaal);
            } else {
                if (player.totalChips < this.state.currentBetBlind) {
                    return;
                }
                this.state.currentBetBlind = this.state.currentBetBlind;
                console.log("notIsRaise" + this.state.currentBetBlind + " " + this.state.currentBetChaal);
            }

            player.currentBet = this.state.currentBetBlind;
            player.totalChips -= player.currentBet;

            player.blindsPerGame = player.blindsPerGame + 1;
            player.totalBet += player.currentBet;

            this.state.pot += player.currentBet;
            this.broadcast("actions", { seat: player.Seatnumber.toString(), action: "Blind", bet: player.currentBet.toString(), totalchips: player.totalChips.toString() });

            if (this.state.pot >= this.pokerConfig.maxPotLimit) {
                console.log("Pot limit reached!");
                this.moveToNextPhase(`show`);
                return;
            }
            else {
                this.check_Packed_player(this.state.activePlayerIndex);
                this.moveToNextPhase(`next`);
            }
        }
    }

    OnMsg_Chaal(client: Client, message: any) {
        let player: Player = this.state.players.get(client.id);
        if (message.isRaise) {

            if (player.totalChips < this.state.currentBetChaal * 2) {
                return;
            }
            this.state.currentBetBlind = this.state.currentBetChaal;
            this.state.currentBetChaal = this.state.currentBetChaal * 2;
            console.log("IsRaise" + this.state.currentBetBlind + " " + this.state.currentBetChaal);


        } else {

            if (player.totalChips < this.state.currentBetChaal) {
                return;
            }
            this.state.currentBetChaal = this.state.currentBetChaal;
            console.log("notIsRaise" + this.state.currentBetBlind + " " + this.state.currentBetChaal);
        }

        player.currentBet = this.state.currentBetChaal;
        player.totalChips -= player.currentBet;
        player.blindsPerGame = 3;
        player.isBlind = false;
        player.totalBet += player.currentBet;

        this.state.pot += player.currentBet;

        this.broadcast("actions", { seat: player.Seatnumber.toString(), action: "Chaal", bet: player.currentBet.toString(), totalchips: player.totalChips.toString() });

        if (this.state.pot >= this.pokerConfig.maxPotLimit) {
            console.log("Pot limit reached!");
            this.moveToNextPhase(`show`);
            return;
        }
        else {
            this.check_Packed_player(this.state.activePlayerIndex);
            this.moveToNextPhase(`next`);
        }
    }

    OnMsg_Pack(client: Client, message: any) {
        let player: Player = this.state.players.get(client.id);
        this.broadcast("actions", { seat: player.Seatnumber.toString(), action: "Packed", totalchips: player.totalChips.toString() });

        console.log(`Player with id ${client.id} is packed` + message);
        // new code
        let client_id: string = this.state.Seatting[this.state.activePlayerIndex].Session_id;

        this.state.players.get(client_id).IsPack = true;
        console.log(this.state.players[client_id].IsPack);
        this.check_Packed_player(this.state.activePlayerIndex);

        this.playerCount--;

        this.Add_User_History(player.totalBet, false, this.Round, player.totalBet, player.User_Id);

        this.moveToNextPhase(`next`);
    }

    OnMsg_SideShow(client: Client, message: any) {
        let player: Player = this.state.players.get(client.id);

        if (player.totalChips < this.state.currentBetChaal) {
            return;
        }
        this.sideshowPlayers.forEach((value, key) =>  {
           // delete this.sideshowPlayers[key];
            this.sideshowPlayers.delete(key);

        });
        var count: number = 0;
        var perv_Seat_client: number = this.Check_For_SlideShow(player);
        this.sideshowPlayers.set(client.id,player);

        this.sideshowPlayers.set(this.state.Seatting[perv_Seat_client].Session_id, this.state.players.get(this.state.Seatting[perv_Seat_client].Session_id));
        console.log("slideShowplayer" + JSON.stringify(this.sideshowPlayers));

        this.IsslideShowrun = true;

        player.currentBet = this.state.currentBetChaal;
        player.totalChips -= player.currentBet;


        player.isBlind = false;
        player.totalBet += player.currentBet;

        console.log(`Current active player current bet is ${player.currentBet}`);
        console.log(`Current active player total bet is ${player.totalBet}`);

        this.state.pot += player.currentBet;
        this.broadcast("actions", { seat: player.Seatnumber.toString(), action: "Side Show", bet: player.currentBet.toString(), totalchips: player.totalChips.toString() });

        if (this.state.pot >= this.pokerConfig.maxPotLimit) {
            console.log("Pot limit reached!");
            this.moveToNextPhase(`show`);
            return;
        }
        // else {
        for (let key in this.clients) {
            if (this.clients[key].id == this.state.Seatting[perv_Seat_client].Session_id) {
                console.log("this SideShow_Request");
                this.clients[key].send(`SideShow_request`, this.state.players.get(this.state.Seatting[this.state.activePlayerIndex].Session_id).Player_name);
            }
        }
    }

    OnMsg_SSRequest(client: Client, message: any) {
        if (message)
        {
            this.sideshowPlayers = this.cardUtils.computeHands(
                this.sideshowPlayers,
                this.pokerConfig.holeCards,
                this.playerUtils.rankByHand
            );

            let winners: ArraySchema<Player> = this.playerUtils.determineWinners(
                this.sideshowPlayers
            );
            console.log("-=-=-=->winner"+JSON.stringify(winners.at(0)));
            if (winners.length > 1) {
                let client_id: string = this.state.Seatting[this.state.activePlayerIndex].Session_id;
                this.state.players.get(client_id).IsPack = true;

                let player: Player = this.state.players.get(client.id);

                this.Add_User_History(player.totalBet, false, this.Round, player.totalBet, player.User_Id);

                this.check_Packed_player(this.state.activePlayerIndex);
                // console.log(this.state.players[client_id].IsPack);
                this.playerCount--;

            }
            else {
                //let client_id: string = winners[0].id;
              this.sideshowPlayers.forEach((value, key) =>  {
                    if (value.id != winners.at(0).id) {
                        value.IsPack = true;
                        let player: Player = value;

                        this. Add_User_History(player.totalBet, false, this.Round, player.totalBet, player.User_Id);
                    }
                });
                this.check_Packed_player(this.state.activePlayerIndex);
                // console.log(this.state.players[client_id].IsPack);
                this.playerCount--;
            }

            this.clients.forEach(element => {
                if (this.sideshowPlayers.get(element.id) != null) {
                    element.send("SSResult", this.sideshowPlayers);
                }
            });
            this.IsslideShowrun = false;
            this.moveToNextPhase(`next`);
        }
        else {
            this.check_Packed_player(this.state.activePlayerIndex);
            this.IsslideShowrun = false;
            this.moveToNextPhase(`next`);
        }
    }

    startGame() {
        this.clearState();
        this.Reseting_Seating(); //this rearrange the List of CurrentSeattingArrange

        if (this.playerCount >= 2) {
            this.state.isGameRunning = true;
            this.Round++;
            this.chooseBlinds();
            this.distributeCards(this.clients[0]);
            this.state.players.forEach((player) => {
                if (player.Seatnumber != -1 && this.state.Seatting[player.Seatnumber].Is_Playing) {
                    player.currentBet = this.state.minBet;
                    player.totalChips -= player.currentBet;

                    //this.Update_UserChips(player.User_Id,player.totalChips);
                    this.broadcast("actions", { seat: player.Seatnumber.toString(), action: "Boot", bet: player.currentBet.toString(), totalchips: player.totalChips.toString() });
                    player.totalBet += player.currentBet;
                    this.state.pot += player.currentBet;
                }
            });
            console.log("POT:::::" + this.state.pot);

            this.state.currentBetBlind = this.state.minBet;
            this.state.currentBetChaal = this.state.minBet * 2;
            // this.state.isGameRunning = true;

            this.clock.setTimeout(() => {
                this.broadcast("Distributed", this.state);
                this.moveToNextPhase(`next`);
            }, 2000);
        }
        else {
            this.state.isGameRunning = false;
        }
    }

    //Reseting the Seating Arrangement
    Reseting_Seating() {
        this.CurrentSeattingArrange.splice(0, this.CurrentSeattingArrange.length);
        for (let i = 0; i < this.state.Seatting.length; i++) {
            if (this.state.Seatting[i].Session_id != "-1") {
                if (this.state.players.get(this.state.Seatting[i].Session_id).totalChips < this.pokerConfig.minBet) {

                    let a = this.state.Seatting[i].Session_id;
                    let seatingstatus :Seatingstatus = new Seatingstatus();
                    seatingstatus.Setvalue("-1" , false);
                    this.state.Seatting[i] = seatingstatus;

                    let player: Player = this.state.players.get(a);
                    player.Seatnumber = -1;
                    player.reset();

                    // delete this.state.Seating[i];
                    console.log("-=-=-Standup=-=-SeatingCount=-=-=-=>");
                    // console.log(this.state.Seating);
                    this.SeatingCount--;
                    //this.playerCount--;
                    player.User_Table_Amount = player.totalChips;
                    this.Update_UserChips(player.User_Id, player.User_Table_Amount);

                }
                else {
                    let seatingstatus = new Seatingstatus();
                    seatingstatus.Setvalue(this.state.Seatting[i].Session_id,true);
                    this.state.Seatting[i] = seatingstatus;
                    this.CurrentSeattingArrange.push(i);
                }
            }
        }
        this.playerCount = this.CurrentSeattingArrange.length;
        console.log("=-=-=-=-=-=-=this.CurrentSeattingArrange-=-=-=-=-=-=-=>" + this.playerCount);
        console.log(this.CurrentSeattingArrange);
    }

    //this will check that there is only one player playing
    Check_Player(): boolean {
        if (this.playerCount == 2 && !this.state.IsShowPossible) {
            this.state.IsShowPossible = true;
            return false;
        }
        else if (this.playerCount == 1) {
            if (this.state.isGameRunning) {
                let unpackplayer: MapSchema<Player> = new MapSchema<Player>();

                for (let i = 0; i < this.state.Seatting.length; i++) {
                    if (this.state.Seatting[i].Session_id == '-1') continue;

                    console.log("Seating:::::::" + this.state.Seatting[i]);

                    if (this.state.Seatting[i].Session_id != "-1" && this.state.Seatting[i].Is_Playing && !this.state.players[this.state.Seatting[i].Session_id].IsPack)
                        unpackplayer.set(this.state.Seatting[i].Session_id,this.state.players.get(this.state.Seatting[i].Session_id));
                }

                console.log(unpackplayer);

                unpackplayer = this.cardUtils.computeHands(
                    unpackplayer,
                    this.pokerConfig.holeCards,
                    this.playerUtils.rankByHand
                );

                this.Winning_Calcution(unpackplayer);
                return true;
            }
            else {
                return true;
            }
        }
        return false;
    }

    //adds a new player to the Room
    addPlayer(sessionId: string, client: Client): Player {
        let newPlayer: Player = new Player();
        newPlayer.id = sessionId;
        newPlayer.totalChips = 0;
        newPlayer.currentBet = 0;
        newPlayer.totalBet = 0;
        newPlayer.Seatnumber = -1;
        console.log(`New Player ${newPlayer.id} added Successfully!!`);
        return newPlayer;
    }

    //this is the timer for the player move
    startTimer(player: Player) {

        console.log("-=-=-starttimer=-=->");
        this.clock.clear();
        this.clock.start();

        this.delayedInterval = this.clock.setInterval(() => {
            try {
                this.broadcast("currentTimer", {
                    timer: this.clock.elapsedTime / 1000,
                    id: player.id,
                });
            }
            catch (e) {
                console.log(e);
                return;
            }
            console.log("Time now " + this.clock.elapsedTime / 1000);
        }, 1000);
        console.log("-=-=-=-=>");
        console.log("this.delayedInterval.pause" + this.delayedInterval.active);

        // After 10 seconds clear the timeout;
        // this will *stop and destroy* the timeout completely
        this.delayedTimeout = this.clock.setTimeout(() => {
            console.log("-=-=-starttimerdelayedTimeout=-=->");
            if (!this.IsslideShowrun) {

                let client_id: string = this.state.Seatting[this.state.activePlayerIndex].Session_id;
                let player: Player = this.state.players.get(client_id);

                player.IsPack = true;

                this.Add_User_History(player.totalBet, false, this.Round, player.totalBet, player.User_Id);

                this.check_Packed_player(this.state.activePlayerIndex);
                // console.log(this.state.players[client_id].IsPack);
                this.playerCount--;
            }
            else {
                // this.
                let per_inves = this.Check_For_SlideShow(player);
                console.log("=-=-=-=per_inves-=-=->" + per_inves);
                for (let i = 0; i < this.clients.length; i++) {
                    if (this.clients[i].sessionId == this.state.Seatting[per_inves].Session_id) {
                        this.clients[i].send(`SideShow_request`, false);
                    }
                }
                this.check_Packed_player(this.state.activePlayerIndex);
                this.IsslideShowrun = false;
            }

            this.delayedInterval.clear();
            this.delayedInterval.reset();

            this.moveToNextPhase(`next`);
        }, 31_000);
    }

    /**
     * Removing the player from the table
     * @param {Client} client - You have to give this parameter of client to get its socket info and send messsage
     * @param {boolean} [removePlayer = false] - True to remove the player from table and False for Stand-up 
     * @returns {void} 
     */
    removePlayer(client: Client, removePlayer: boolean = false) {
        console.log(this.state.Seatting);
        let find_the_index: number = this.state.Seatting.findIndex(x => x.Session_id == client.sessionId)

        if (find_the_index == -1 && removePlayer) {
            this.state.players.delete(client.sessionId);
            return;
        }

        let player: Player = this.state.players.get(client.id);
        player.Seatnumber = -1;

        if(this.state.Seatting.at(find_the_index).Is_Playing)
            this.playerCount--;

        let newSeating_status :Seatingstatus = new Seatingstatus();
        newSeating_status.Setvalue("-1",false);

        this.state.Seatting.setAt(find_the_index,newSeating_status);
        player.reset();

        this.SeatingCount--;

        console.log("removeplayercount"+this.playerCount);
        player.User_Table_Amount = player.totalChips;

        this.Update_UserChips(player.User_Id, player.User_Table_Amount);

        if (!player.IsPack && this.state.isGameRunning)
            this.Add_User_History(player.totalBet, false, this.Round, player.totalBet, player.User_Id);

        if (this.playerCount == 1 && this.state.isGameRunning) {
            // this.clock.clear();
            this.broadcast(`closeplanel`, this.state.activePlayerIndex);
            let unpackplayer: MapSchema<Player> = new MapSchema<Player>();
            for (let i = 0; i < this.state.Seatting.length; i++) {
                if (this.state.Seatting[i].Session_id != "-1" && this.state.Seatting[i].Is_Playing &&
                    !this.state.players[this.state.Seatting[i].Session_id].IsPack) {
                    unpackplayer.set(this.state.Seatting[i].Session_id , this.state.players.get(this.state.Seatting[i].Session_id));
                }
            }
            unpackplayer = this.cardUtils.computeHands(
                unpackplayer,
                this.pokerConfig.holeCards,
                this.playerUtils.rankByHand
            );
            this.Winning_Calcution(unpackplayer);
            this.clock.clear();
            this.clearState();
        }
        else if (this.playerCount == 1) {
            return;
        }
        else if (this.playerCount >= 2 && this.state.isGameRunning) {
            if (this.playerCount == 2 && this.state.isGameRunning) {
                this.state.IsShowPossible = true;
                let data = {
                    "activeindex": this.state.activePlayerIndex,
                }
                this.broadcast("IsShowPossible", data);
            }
            console.log("-=-=-Start game=-=-=->" + find_the_index + " " + this.state.activePlayerIndex);
            if (find_the_index == this.state.activePlayerIndex) {
                this.clock.clear();
                this.check_Packed_player(this.state.activePlayerIndex);
                console.log("-=-=-Start game=-=-=->" + this.state.activePlayerIndex);
                this.moveToNextPhase(`next`);
            }
        }
        if (removePlayer) {
            console.log(`${client.sessionId} Player removed!!`);
            this.state.players.delete(client.sessionId);
            if (this.clients.length < this.pokerConfig.minPlayers) {
                this.unlock();
            }
        }
    }

    // this will call the and find the folded player
    check_Packed_player(message) {
        var count: number = 0;
        //#region new code final

        // console.log("-=-=check_Packed_player activePlayerIndex-=->"
        //     + this.state.activePlayerIndex +
        //     this.state.players[this.state.Seatting[this.state.activePlayerIndex].Session_id].IsPack);

        while (count <= this.state.Seatting.length) {

            this.state.activePlayerIndex =
                ((message + 1 + count) % this.state.Seatting.length);

            let client_id: Seatingstatus = this.state.Seatting[this.state.activePlayerIndex];

            let player: Player = this.state.players.get(client_id.Session_id);

            if (client_id.Session_id != "-1" && client_id.Is_Playing && !player.IsPack) {
                console.log("-=-=check_Packed_player-=-> " + player.blindsPerGame);
                console.log(player.IsPack + " " + player.id);
                if (player.blindsPerGame == 3 && player.isBlind) {
                    player.isBlind = false;
                    this.clients.forEach(element => {
                        if (element.id == client_id.Session_id) {
                            console.log("-=-=check_Packed_player-=-> " + player.blindsPerGame);
                            element.send("See", player);
                        }
                    });
                }
                break;
            }
            count++;
        }
        //#endregion
    }

    //This will Reset the whole game state
    clearState() {
        this.state.reset();
    }

    //distributes Cards to all players
    distributeCards(client: Client) {
        this.deck.splice(0, this.deck.length);
        this.deck = this.cardUtils.getDeck();

        //#region for orginal logic uncommit this   
        for (let i = 0; i < this.pokerConfig.holeCards; i++) {
            this.state.players.forEach((value, key) => {

                if (value.Seatnumber != -1 && this.state.Seatting[value.Seatnumber].Is_Playing) {
                    let player: Player = value;
                    let res = this.cardUtils.popCards(this.deck, 1);
                    this.deck = res.deck;

                    // res.chosenCards[0].isHole = true;
                    player.cards.push(res.chosenCards[0]);

                    if (player.cards.length === this.pokerConfig.holeCards) {
                        player.replacedCards = player.cards.clone();
                        //client.send('myinfo', player.cards);
                    }
                }
            });
        }
        //#endregion
        //#region for testing
        // let count: number = 0;
        // var tempC: CardUtils = new CardUtils();
        // this.state.players.forEach((value, key) =>  {
        //     let player: Player = value;
        //     console.log("-=-=-=-count=-=-=->" + count);
        //
        //     // let res = this.cardUtils.popCards(this.state.deck, 1);
        //     // this.state.deck = res.deck;
        //     switch (count) {
        //
        //         case 0:
        //             var temp: Card = new Card(1, tempC.suits[0]);
        //             player.cards.setAt(0,temp);
        //             //console.log(JSON.stringify(player.cards));
        //
        //             temp = new Card(7, tempC.suits[1]);
        //             player.cards.setAt(1,temp);
        //             //console.log(JSON.stringify(player.cards));
        //
        //             temp = new Card(7, tempC.suits[0]);
        //             player.cards.setAt(2,temp);
        //             //console.log(JSON.stringify(player.cards));
        //
        //             //player.cards.push(temp);
        //
        //
        //             break;
        //
        //         case 1:
        //             var temp: Card = new Card(7, tempC.suits[0]);
        //             player.cards.setAt(0,temp);
        //             //console.log(JSON.stringify(player.cards));
        //
        //             temp = new Card(1, tempC.suits[2]);
        //             player.cards.setAt(1,temp);
        //             //console.log(JSON.stringify(player.cards));
        //
        //             temp = new Card(9, tempC.suits[0]);
        //             player.cards.setAt(2,temp);
        //             // console.log(JSON.stringify(player.cards));
        //             break;
        //
        //         case 2:
        //             var temp: Card = new Card(13, tempC.suits[1]);
        //             player.cards.setAt(0,temp);
        //             //console.log(JSON.stringify(player.cards));
        //
        //             temp = new Card(12, tempC.suits[2]);
        //             player.cards.setAt(1,temp);
        //             //console.log(JSON.stringify(player.cards));
        //
        //             temp = new Card(5, tempC.suits[1]);
        //             player.cards.setAt(2,temp);
        //         // console.log(JSON.stringify(player.cards));
        //
        //     }
        //     player.replacedCards = player.cards.clone();
        //     count++;
        //
        //     console.log(JSON.stringify(player.cards));
        //
        // });
        //#endregion




        this.state.minBet = this.pokerConfig.minBet;
        this.state.currentBet = this.pokerConfig.minBet;
    }

    //Choose Small & Big Blinds
    chooseBlinds() {

        //this will contain the index of the CurrentSeattingArrange
        var selected_index: number = this.playerUtils.getRandomPlayer(this.CurrentSeattingArrange.length);
        var selected_seat= this.CurrentSeattingArrange[selected_index];
        console.log("selected_index"+selected_index +" "+JSON.stringify(this.CurrentSeattingArrange));

        this.playerCount = this.CurrentSeattingArrange.length;

        this.state.dealerIndex = selected_seat;
        // console.log("-=-=-=-Seating-==-=-=-=-=-=->" + selected_seat + " " + this.state.Seating[selected_seat.toString()]);
        // console.log(this.state.Seating);

        //this will set the dealer
        //this.state.players[this.state.Seating[selected_seat.toString()]].isDealer = true;

        //arranging the first player how will play
        var first_player: number = (selected_index + 1) % this.playerCount;
        this.state.activePlayerIndex = this.CurrentSeattingArrange[first_player];
        console.log("-=-=-=-=dealerIndex-=-=-=>" + this.state.dealerIndex + " " + this.playerCount);

    }

    //Start Game timer will reset the whole timer
    Startgame_TimerReset() {
        if (this.SeatingCount >= this.pokerConfig.minPlayers)
        {
            // this.state.isGameRunning = true;
            this.clock.clear();
            this.clearState();

            // setTimeout(()=>{
            //setTimeout(() => {
            this.clock.start();
            this.delayedInterval = this.clock.setInterval(() => {
                this.broadcast("timer", Math.floor(this.clock.elapsedTime / 1000));
                console.log("'Starting game!");
            }, 1000);
            this.clock.setTimeout(() => {
                console.log("this.clock.setTimeout-=-=>");

                this.delayedInterval.clear();
                // this.clearState();

                if (this.SeatingCount >= this.pokerConfig.minPlayers)
                    this.startGame();
                else
                    this.state.isGameRunning = false;

            }, 4_000);
            // }, 2_000);
            //},5000);
        }
    }

    //This Calculate the winner for the player and send the message
    Winning_Calcution(player: MapSchema<Player>) {
        let winners: ArraySchema<Player> = this.playerUtils.determineWinners(
            player
        );
        winners.forEach((player) => {
            this.state.winningPlayers.push(player);
        });

        console.log("Send broadcast" + JSON.stringify(this.state.winningPlayers));

        if (winners.length > 1) {

            if (this.state.pot >= this.pokerConfig.maxPotLimit) {
                this.state.winningPlayers.forEach(value => {
                    this.DivideWinningPot(value,this.state.winningPlayers.length);
                    //console.log(this.state.players[value.id].totalChips);
                });
            }
            else {
                this.state.winningPlayers.forEach(value => {
                    if (value.id != this.state.Seatting[this.state.activePlayerIndex].Session_id) {
                        this.DivideWinningPot(value,this.state.winningPlayers.length-1);
                        //console.log(this.state.players[value.id].totalChips);
                    }
                    else {
                        delete this.state.winningPlayers[value.id];
                    }
                });
            }
        }
        else {
            this.state.winningPlayers.forEach(value => {
                this.DivideWinningPot(value,this.state.winningPlayers.length);
                // console.log(this.state.players[value.id].totalChips);
            });
        }

        player.forEach((value, key) =>
        {
            let a: number = this.state.winningPlayers.findIndex(x => x.id == key);
            if (a == -1) {
                console.log("-=-=-=-=-aaaaaaaaaaaaaa=-=-=-=-=-=-=>" + a);
                this.Add_User_History(value.totalBet, false, this.Round, value.totalBet, value.User_Id);
            }
            else {
                let amount = (this.state.pot * (100 - this.state.Commission_Rate)) / 100;
                let winningprice = amount / this.state.winningPlayers.length

                this.Add_User_History(winningprice, true, this.Round, value.totalBet, value.User_Id);
                // this.Add_Commission_LobbyHistory(value,this.state.winningPlayers.length)
            }
        });
        //the person who will give the show and the cards of both players are same that
        //than the person who give show will lose
        // this.Add_Commission_LobbyHistory(player);

        this.broadcast(`winning`, this.state);
        this.state.isGameRunning = false;
        if (this.SeatingCount > 1) {
            this.clock.setTimeout(() => {
                if (this.SeatingCount > 1)
                    this.Startgame_TimerReset();
            }, 3000);
        }
    }

    DivideWinningPot(player:Player , winnerlenght:number){
        let amount = (this.state.pot * (100 - this.state.Commission_Rate)) / 100;
        this.state.pot = amount;
        console.log ("this.state.winningPlayers.length"+winnerlenght);
        let winningprice = amount / (winnerlenght)
        player.totalChips += winningprice;
    }

    //This Will find the there is any Player to Do slideShow
    Check_For_SlideShow(player: Player): number {
        console.log(player.IsSS + player.id);
        let count: number = 1;
        let perv_ins: number = player.Seatnumber;
        if (!this.state.IsShowPossible) {
            while (count <= this.state.Seatting.length) {
                perv_ins -= 1;
                if (perv_ins == -1) {
                    perv_ins = 8;
                }
                if (this.state.Seatting.at(perv_ins).Session_id != "-1"
                    && !this.state.players.get(this.state.Seatting.at(perv_ins).Session_id).IsPack) {
                    if (!this.state.players.get(this.state.Seatting.at(perv_ins).Session_id).isBlind) {

                        console.log("perv_ins" + perv_ins);
                        player.IsSS = true;
                        return perv_ins;
                    }
                    else {
                        player.IsSS = false;
                        return -1;
                    }
                }
                count++;
            }
        }
        else {
            player.IsSS = false;
            return -1;
        }
    }

    //Move to next phase if all players bets are equal else return false to move to next player
    moveToNextPhase(phase: string): boolean {
        this.clock.clear();
        let client_id: string = this.state.Seatting.at(this.state.activePlayerIndex).Session_id;
        console.log("moveToNextPhase" + client_id);
        this.broadcast(`closeplanel`, this.state.activePlayerIndex);
        if (client_id == "-1" || this.SeatingCount<=1) {
            return;
        }

        if (this.Check_Player()) {
            return true;
        }
        else if (phase === `next`) {
            this.Check_For_SlideShow(this.state.players.get(client_id));
            this.clock.setTimeout(() => {
                this.startTimer(this.state.players[this.state.Seatting[this.state.activePlayerIndex].Session_id]);
                this.broadcast(`nextPlayerMove`, this.state);
                return true;
            }, 2000);
        }
        else if (phase === `show`) {

            let unpackplayer: MapSchema<Player> = new MapSchema<Player>();

            this.state.players.forEach((value, key) =>
            {
                if (value.Seatnumber != -1 && this.state.Seatting[value.Seatnumber].Is_Playing && !value.IsPack)
                    unpackplayer.set(key,value);
            });

            unpackplayer = this.cardUtils.computeHands(
                unpackplayer,
                this.pokerConfig.holeCards,
                this.playerUtils.rankByHand
            );

            this.clock.clear();
            this.Winning_Calcution(unpackplayer);
            return true;
        }
        else {
            return false;
        }
    }

    async Get_Wallet_Amount(User_Id): Promise<number> {
        try {
            const connection = await DbUtils.getConnection();

            const user = await connection.getRepository(User_Profile).createQueryBuilder()
                .select(['DISTINCT user.User_Id"User_Id"', 'w.User_Chips"User_Chips"'])
                .from(User_Profile, 'user')
                .innerJoin('user.Wallet', 'w')//changed
                .where("user.User_Id = :id", { id: User_Id })
                .getRawOne();
            //console.log("wallettest:",user.User_Chips);
            return user.User_Chips;
        }
        catch (e) {
            console.log(e);
            return -1;
        }

    }

    async Update_UserChips(User_Id: number, Amount: number) {
        try {
            const connection = await DbUtils.getConnection();
            const user = await connection.getRepository(Wallet)
                .createQueryBuilder()
                .update(Wallet)
                .set({ User_Chips: Amount })
                .where("User = :id", { id: User_Id })//changed
                .execute();

            console.log("updated:", user);

            return user;
        }
        catch (error) {
            console.log(error);
        }
    }
    // async Add_Commission_LobbyHistory(player:Player , winnercount : number) {
    //     try {

    //         const connection = await DbUtils.getConnection();
    //         const comsn = new Lobby_Commision();
    //         comsn.Lobby_Round = this.Round;
    //         comsn.Total_Bet = this.state.pot;
    //         comsn.Admin_Commision_Amount = ((3 * this.state.pot) / (100*winnercount));
    //         comsn.Bookie_Commision_Amount = ((1 * this.state.pot) / 100);
    //         comsn.Is_Paid = false;
    //         comsn.Lobby = await connection.manager.findOne(Lobby, { where: { Lobby_Id: this.state.Lobby_id } });
    //         let user = await connection.manager.findOne(User_Profile, { where: { User_Id: player.User_Id } }); //add user_id to this field
    //         comsn.Referral = await connection.manager.findOne(Admin, { where: { Admin_Id: user.Reference_By } });
    //         await connection.manager.save(comsn);

    //         //console.log("updated:",comsn);

    //         return comsn;
    //     }
    //     catch (error) {
    //         console.log(error);
    //     }
    // }

    async Add_User_History(Amount: number, User_Win: boolean,
        //User_status: boolean, User_Seating: boolean,
                           Lobby_Round: number, TotalBet: number, User_id: number) {
        try {
            const connection = await DbUtils.getConnection();
            const uh = new Lobby_History();
            uh.User_Win_Status = User_Win;
            uh.Amount = Amount;
            uh.Lobby_Round = Lobby_Round;
            uh.Total_Bet = TotalBet;
            uh.Lobby_Id = await connection.manager.findOne(Lobby, { where: { Lobby_Id: this.state.Lobby_id } });
            uh.User_Id = await connection.manager.findOne(User_Profile, { where: { User_Id: User_id } });
            await connection.manager.save(uh);

            //  console.log("updated:",uh);

            return uh;
        }
        catch (error) {
            console.log(error);
        }
    }

    async Adding_data_To_Lobby(options) {
        console.log(options);
        const connection = await DbUtils.getConnection();

        let lobby = new Lobby();
        lobby.Club_Id = await connection.manager.findOne(Club, { where: { Club_Id: options.club_ID } });
        lobby.Variation_Id = await connection.manager.findOne(Variation, { where: { Variation_Initial: options.type } });
        lobby.Lobby_Owner_Id = await connection.manager.findOne(User_Profile, { where: { User_Id: options.owner_ID } });
        lobby.Lobby_Commision_Rate = 3;
        lobby.Lobby_Name = options.roomName;
        lobby.Lobby_Type = options.type;
        lobby.Lobby_Total_Persons = options.numberOfPlayers;
        lobby.Lobby_Boot_Amount = options.bootAmount;
        lobby.Lobby_Min_Player_Limit = 2;
        lobby.Lobby_Pot_Limit = 0;
        lobby.Lobby_Min_Bet = options.bootAmount;
        lobby.Lobby_Max_Bet = options.maxBet;
        lobby.Room_Id = this.roomId;
        await connection.manager.save(lobby);

        this.state.Lobby_id = lobby.Lobby_Id;
        this.state.Commission_Rate = 3;

        console.log(this.state);

        let meta: metadata = new metadata();
        meta.Setvalue(options.roomName, options.pwd, options.owner_ID, options.club_ID, lobby.Lobby_Id)
        this.setMetadata(meta);
        //  console.log(this.metadata);
    }

    /**
     * Removing the player from the table
     * @param {Client} [client = null] - You have to give this parameter of client to get its socket info and send messsage
     * @param {boolean} [broadcast = false] - True to send the broadcast and False to send the image to single client
     * @returns {void} 
     */
    async Sending_Image(client: Client, broadcast: boolean = false) {
        if (!broadcast) {
            let senddata = [];
            console.log("lol"+this.state.players)
            for(let player of this.state.players) {
                if (player[1].Seatnumber != -1 && player[0] != client.sessionId) {
                    const connection = await DbUtils.getConnection();
                    let data = await connection.getRepository(User_Profile).createQueryBuilder()
                        .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Image"User_Image"'])
                        .from(User_Profile, 'user')
                        .where("user.User_Id = :id", {id: player[1].User_Id})
                        //.take(10).skip(0)
                        .getRawMany();
                    //console.log("-=-=->"+JSON.stringify(data));
                    if (data.length > 0) {
                        senddata.push(
                            {
                                "Seatnumber": player[1].Seatnumber,
                                "Image": data[0].User_Image,
                                "User_id": data[0].User_Id,
                                "totalchips": player[1].totalChips,
                                "sessionid": player[0]
                            });
                    }
                }
            }
            client.send(`allimage`, JSON.stringify(senddata));
        }
        else {
            let senddata = [];
            const connection = await DbUtils.getConnection();
            let data = await connection.getRepository(User_Profile).createQueryBuilder()
                .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Image"User_Image"'])
                .from(User_Profile, 'user')
                .where("user.User_Id = :id", { id: this.state.players[client.sessionId].User_Id })
                //.take(10).skip(0)
                .getRawMany();

            senddata.push(
                {
                    "Seatnumber": this.state.players[client.sessionId].Seatnumber,
                    "Image": data[0].User_Image,
                    "User_id": data[0].User_Id,
                    "totalchips": this.state.players[client.sessionId].totalChips,
                    "sessionid": client.sessionId
                });

            console.log(senddata);
            this.broadcast(`allimage`, JSON.stringify(senddata));
        }
    }
}
