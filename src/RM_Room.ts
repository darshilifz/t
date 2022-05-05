import { Room, Client, SchemaSerializer, Delayed } from 'colyseus';
import { MapSchema, ArraySchema } from '@colyseus/schema';
import { GameState, Player, Card } from './State';
import { Var1CardUtils } from './utils/RM_CardUtils';
import { PlayerUtils } from './utils/PlayerUtils';
import { GameConfig } from './GameConfig';
import { Seatingstatus } from './Seatingstatus';
import { BaseRoom } from './BaseRoom';

export class RoyalMarriage extends BaseRoom {

    cardUtils: Var1CardUtils = new Var1CardUtils(); //Utilities for Cards

    deck:Array<Card> = new Array<Card>();
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
           //this.deck = newDeck;
            client.send("newCards", player);

            player.replacedCards = player.cards.clone();

            //Call function to check Joker card in player cards
            this.joker_Calculation(player);
            // console.log(JSON.stringify(player.cards[replaced.jokerIndex]));

            // client.send("replacingCards",player);
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

                this.moveToNextPhase(`next`);
            }, 2000);
        }
        else
        {
            this.state.isGameRunning = false;
        }
    }

    //#region
    jokerCard() {
        let jokerCard = this.cardUtils.popCards(this.deck, 1);
        this.deck = jokerCard.deck; //Update new Deck to State deck
        this.state.jokerCard = jokerCard.chosenCards[0];
        console.log(jokerCard.chosenCards[0].toJSON());
        //Broadcast selected card to all players
    }
    //#endregion

    joker_Calculation(player: Player) {
        console.log("THE DECK:::::: " + this.deck);
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
