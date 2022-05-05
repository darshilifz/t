import { MapSchema, ArraySchema } from '@colyseus/schema';
import { Player, Card } from "../State";
import { CardUtils } from './CardUtils';
import { Var1CardUtils } from './RM_CardUtils';

export class Var2CardUtils extends Var1CardUtils {
	//Royal Three Difference Game
	//Player can take upto 3 cards from deck
	getCardsFromDeck(deck: Array<Card>, player: Player, cardCost: number) {
		let playerNewCard: Card = new Card();
		let playerChips: number;
		let cardForChips: number = 100;
		let gotCard: boolean = false;
		playerChips = player.totalChips;
        console.log(cardCost);

		if (playerChips > cardCost) {		//Check if player had enough chips

			if (player.newCardCount < 3) {
				if (player.cards.length === 3) {
					let newCard = this.popCards(deck, 1);		//Select Card from deck
					deck = newCard.deck;		//update popcard to state Deck
					playerNewCard = newCard.chosenCards[0];
					console.log("New Card:" + JSON.stringify(playerNewCard));
					player.totalChips -= cardCost * (player.newCardCount+1);
					player.newCardCount++;
					gotCard = true;
					console.log()
				}
			}
			else {
				gotCard = false
				console.log("Player has taken maximum cards");
			}
		}
		else {
			gotCard = false;
			//TODO Open chips shop panel
			console.log("Player Chips: =-=-=>   " + player.totalChips);
			console.log("Player doesn't have enough chips!");
		}

		return { gotCard, player, playerNewCard, deck };
	}
}