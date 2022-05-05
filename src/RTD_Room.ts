import { Room, Client, SchemaSerializer, Delayed } from 'colyseus';
import { MapSchema, ArraySchema } from '@colyseus/schema';
import { GameState, Player, Card } from './State';
import { Var2CardUtils} from './utils/RTD_CardUtils';
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
import { BaseRoom } from './BaseRoom';
const routes = require('../dbscripts/src/routes');

export class RoyalThreeDifference extends BaseRoom {

    cardUtils: Var2CardUtils = new Var2CardUtils(); //Utilities for Cards

    deck:Array<Card> = new Array<Card>();
    //Create the Room
    onCreate(options: any) {
        // console.log("Hi");
        this.setState(new GameState());
        for (let i = 0; i < 9; i++) {
            this.state.Seatting[i] = new Seatingstatus();
        }

        console.log(`Room ${this.roomName} created with roomId ${this.roomId}`);

        //Setup Helper class objects
        this.cardUtils = new Var2CardUtils();
        this.playerUtils = new PlayerUtils();
        if (options.Customoptions.club_ID != -1) {
            this.autoDispose = false;
        }
        else {
            this.autoDispose = true;
        }
        //Set state

        this.pokerConfig = new GameConfig();
        this.pokerConfig.setupConfig(options);

        this.maxClients = options.maxClients;
        this.maxPlayer = options.maxClients;

        this.pokerConfig.maxPotLimit = options.Customoptions.maxPotLimit;
        this.pokerConfig.maxBetLimit = options.Customoptions.maxBet;
        this.pokerConfig.minBet = options.Customoptions.bootAmount;
        this.pokerConfig.table_Max_Amount = options.Customoptions.maxBet;

        this.pokerConfig.cardCost = options.Customoptions.bootAmount * 0.1;
        this.state.minBet = this.pokerConfig.minBet;
        this.Adding_data_To_Lobby(options.Customoptions);
        //Set the lobby id and over here if it is lobby

        //Set message handlers
        this.initializeMessageHandlers();
    }

    //Initialize all the message handler to be handled from Client
    initializeMessageHandlers() {
        super.initializeMessageHandlers();

        this.onMessage("extraCard", (client, message) => {
            let player = this.state.players[client.id];
            // this.state.players[this.state.Seating[client.sessionId]]
            //TODO on message recieve get card index and delete from player cards array
            let extraCard = player.cards.splice(message, 1);
            // Push extra Card to deck
            let newDeck = this.cardUtils.pushCard(this.deck, extraCard[0]);
            this.deck = newDeck;
            client.send("newCards", player);

            player.replacedCards = player.cards.clone();

            //Call function to check Joker card in player cards
            this.joker_Calculation(player);
            // console.log(JSON.stringify(player.cards[replaced.jokerIndex]));

            // client.send("replacingCards",player);
        });

        //Choose extra card from deck
        this.onMessage(`chooseCardFromDeck`, (client, message) => {
            let player: Player = this.state.players.get(client.sessionId);
            let newExtraCard = this.cardUtils.getCardsFromDeck(
                this.deck,
                player,
                this.pokerConfig.cardCost
            );
            console.log("NEW CARD COUNT: " + player.newCardCount);
            if (newExtraCard.gotCard) {
                this.deck = newExtraCard.deck;
                player.cards.push(newExtraCard.playerNewCard); //Store new card to player state cards
                this.state.pot += player.totalChips - newExtraCard.player.totalChips;
                player.totalBet += player.totalChips - newExtraCard.player.totalChips;
                player.totalChips = newExtraCard.player.totalChips;

                client.send(`newExtraCard`, player);
                // this.Update_UserChips(player.User_Id, player.totalChips);
                this.broadcast("actions", { seat: this.state.players[client.id].Seatnumber.toString(), action: "New Card", bet: this.pokerConfig.cardCost*this.state.players[client.id].newCardCount, totalchips: player.totalChips });
            }
            else {
                if (player.newCardCount >= 3) {
                    client.send(`NewCard_NotAvail`, "Max. Cards Reached!");
                }
                else {
                    client.send(`NewCard_NotAvail`, "You don't have enough chips!");
                }
            }
        });

        this.onMessage(`card_cost`,(client,message)=>
        {
            if(this.state.players.get(client.id).newCardCount < 3)
                client.send("card_cost", this.pokerConfig.cardCost * (this.state.players[client.id].newCardCount+1));
            else
            {
                client.send(`NewCard_NotAvail`, "Max. Cards Reached!");
            }
        });
    }

    startGame() {
        this.clearState();
        this.Reseting_Seating(); //this rearrange the List of CurrentSeattingArrange
        if (this.playerCount >= 2 ) {
            this.Round++;
            this.state.isGameRunning = true;
            this.chooseBlinds();
            this.distributeCards(this.clients[0]);

            this.jokerCard();

            //#endregion
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

            this.state.currentBetBlind = this.state.minBet;
            this.state.currentBetChaal = this.state.minBet * 2;
            // this.state.isGameRunning = true;

            this.clock.setTimeout(() => {
                this.broadcast("Distributed",this.state);
                this.broadcast("jokerCard", this.state.jokerCard);


               // if (!this.moveToNextPhase(`next`)) {
                //     // console.log("-=-=-Start game=-=-=->");
                //     // this.startTimer(this.state.players[this.state.Seatting[this.state.activePlayerIndex].Session_id]);
                //     // this.broadcast(`nextPlayerMove`, this.state);
                // }
                this.moveToNextPhase(`next`);
            }, 1000 * this.playerCount);
        }
        else
        {
            this.state.isGameRunning = false;
        }
    }

    //#region
    jokerCard() {
        //Shuffle available cards in deck
        // this.state.deck = this.var1CardUtils.getDeck();
        //select available cards from deck
        let jokerCard = this.cardUtils.popCards(this.deck, 1);
        this.deck = jokerCard.deck; //Update new Deck to State deck
        this.state.jokerCard = jokerCard.chosenCards[0];
        console.log(jokerCard.chosenCards[0].toJSON());
        //Broadcast selected card to all players
    }
    //#endregion

    joker_Calculation(player: Player) {
        let replaced = this.cardUtils.checkJokerCards(
            player,
            this.state.jokerCard,
            this.deck
        );
        console.log(JSON.stringify(replaced.rC));

        if (replaced.rC != null) {
            if (replaced.rC.length == 1) {
                player.replacedCards[replaced.jokerIndex] = replaced.rC[0];
            }
            else if (replaced.rC.length == 2) {
                player.replacedCards[replaced.jokerIndex1] = replaced.rC[0];
                player.replacedCards[replaced.jokerIndex2] = replaced.rC[1];
            }
            else {
                player.replacedCards = replaced.rC;
            }
        }

        let cardHand = this.cardUtils.computeHandsForCards(player, 3, player.cards, this.playerUtils.rankByHand);
        let replaceCardHand = this.cardUtils.computeHandsForCards(player, 3, player.replacedCards, this.playerUtils.rankByHand);

        if (this.playerUtils.rankByHand.indexOf(cardHand) > this.playerUtils.rankByHand.indexOf(replaceCardHand)) {
            player.hand = replaceCardHand;
        }
        else {
            player.replacedCards = player.cards.clone();
            player.hand = cardHand;
        }

        console.log(JSON.stringify(player.cards));
        console.log(JSON.stringify(player.replacedCards));
        this.deck = replaced.nD;
    }
}
