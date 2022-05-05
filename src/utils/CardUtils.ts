import { MapSchema, ArraySchema } from '@colyseus/schema';
import { Player, Card } from "../State";
import { GameConfig } from "../GameConfig";
import { log } from 'console';

//Utility class for Cards
export class CardUtils {
	totalCards = 52;
	suits = [
		'Heart', //0
		'Spade', //1
		'Club', //2
		'Diamond' //3
	];

	//These varaibles are just for refrence of how the card numbers are used by the back-end server
	//These are never used
	cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
	VALUE_MAP = {
		2:1,
		3:2,
		4:3,
		5:4,
		6:5,
		7:6,
		8:7,
		9:8,
		10:9,
		J:10,
		Q:11,
		K:12,
		A:13
	};

	randomizePosition = (min: number, max: number) => {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	getShuffledNums = () => {
		let shuffledNums = new Array<number>(this.totalCards);
		for (let i = 0; i < this.totalCards; i++) {
			if (i === 51) {
				// Fill last undefined slot when only 1 card left to shuffle
				const lastSlot = shuffledNums.findIndex((val) => val == undefined);
				shuffledNums[lastSlot] = i + 1;
			}
			else {
				let shuffleToPosition = this.randomizePosition(0, this.totalCards - 1);
				while (shuffledNums[shuffleToPosition]) {
					shuffleToPosition = this.randomizePosition(0, this.totalCards - 1);
				}
				shuffledNums[shuffleToPosition] = i + 1;
			}
		}
		return shuffledNums;
	}

	popCards = (deck: Array<Card>, numToPop: number) => {
		let chosenCards: Array<Card> = new Array<Card>();
		for(let i = 0; i < numToPop; i++) {
			chosenCards.push(deck.pop());
		}
		return { deck, chosenCards };
	}

	getSuit(card: number) : string {
		let res = Math.floor(card / 13);
		let mod = card % 13;
		if( mod == 0 )
			res--;

		return this.suits[res];
	}

	getDeck() : Array<Card> {
		let nums = this.getShuffledNums();
		let deck: Array<Card> = new Array<Card>();
		nums.forEach((num) => {
			let card: Card = new Card();
			card.suit = this.getSuit(num);
			let number = num % 13;
			if(number == 0)
				number = 13;
			card.num = number;
			deck.push(card);
		});
		return deck;
	}

	revealPhaseComunityCards(phase: string, deck: Array<Card>) {
		let comCards: Array<Card> = new Array<Card>();
		let res;
			res = this.popCards(deck, 3);
			res.chosenCards.forEach((chosenCard) => {
				comCards.push(chosenCard);
			});
		
		return {deck: res.deck, communityCards: comCards };
	}

	computeHands(players: MapSchema<Player>, cardsInHand: number, rankByHand: string[]) : MapSchema<Player> {
		players.forEach((player, key) =>
		{
			// console.log(`++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);
			// console.log(`Player hand Compute for ${player.id}`);

			// player = this.computeHandAsPerGameConfig(player, cardsInHand, rankByHand);
			players.set(key,this.computeHandAsPerGameConfig(player, cardsInHand, rankByHand));
		});
		
		return players;
	}
	
	computeHandAsPerGameConfig(player: Player, cardsInHand: number, rankByHand: string[]) : Player {
		// console.log(cardsInHand);
		let startPlayerCardIndex: number = 0;
		let nextPlayerCardIndex: number = 0;
		let playerCardUsed: number = 0;

		let previousCards: ArraySchema<number> = new ArraySchema<number>();
		let previousSuits: ArraySchema<string> = new ArraySchema<string>();

		// console.log(cardsInHand);
		
		do {			
			let playerCardsToBeUsed: Array<Card> = new Array<Card>();
			
				playerCardsToBeUsed.push(player.replacedCards.at(playerCardUsed));
				playerCardUsed = (playerCardUsed + 1) % player.replacedCards.length;
				
				previousCards.push(player.replacedCards.at(playerCardUsed).num);
				previousSuits.push(player.replacedCards.at(playerCardUsed).suit);
				
				nextPlayerCardIndex = (nextPlayerCardIndex + 1) % player.replacedCards.length;
				playerCardUsed = nextPlayerCardIndex;

				console.log(`Next Player Card Start Index: ${nextPlayerCardIndex}`);

				let comCardsToBeUsed: Array<Card> = new Array<Card>();

				console.log(`In Comm Cards Do Cards in Hand: ${cardsInHand}`);

				let cardsToBeUsed: Array<Card> = new Array<Card>();
				
				playerCardsToBeUsed.forEach((card) => {
					cardsToBeUsed.push(card);
				});
				console.log("Player Card : "+JSON.stringify(cardsToBeUsed));

				let cardFrequency: MapSchema<number> = new MapSchema<number>();

				let suitFrequency: MapSchema<number> = new MapSchema<number>();

				previousCards.sort((a,b) => { return a-b });

				previousCards.forEach((card) => {
					if(cardFrequency.get(card.toString())) {
						cardFrequency.set(card.toString(),cardFrequency.get(card.toString())+1);
						return 
					}
					cardFrequency.set(card.toString(), 1);
				});
				previousSuits.forEach((suit) => {
					if(suitFrequency.get(suit.toString())) {
						suitFrequency.set(suit.toString(),suitFrequency.get(suit.toString())+1);
						return 
					} suitFrequency.set(suit.toString(), 1);
				});
			
				// console.log(`==================================================`);
				// console.log(`Card Frequency ${JSON.stringify(cardFrequency)}`);
				// console.log(`Suit Frequency ${JSON.stringify(suitFrequency)}`);
				// console.log(`Previous Suits Used ${JSON.stringify(previousSuits)}`);
				// console.log(`Previous Cards Used ${JSON.stringify(previousCards)}`);
				// console.log(`Card To Be Use : ${JSON.stringify(cardsToBeUsed)}`);
				let handRes = this.computePlayerHand(suitFrequency, cardFrequency, cardsToBeUsed, previousCards);

				let changeRes: boolean = false;
				if(player.hand === undefined) {
					changeRes = true;
				}
				else {
					if(rankByHand.indexOf(player.hand) > rankByHand.indexOf(handRes.hand))
						changeRes = true;
				}

				if(changeRes) {
					player.hand = handRes.hand;
					player.bestHand.splice(0, player.bestHand.length);
					handRes.bestHand.forEach((card) => {
						player.bestHand.push(card);
					});
				}
		}	
		
		while(nextPlayerCardIndex != startPlayerCardIndex);

		// console.log(`Player Best Hand Name ${player.hand}`);
		// // console.log(`Player Best Hand -- ${JSON.stringify(player.bestHand)}`);
		// console.log(`==================================================`);		

		return player;
	}
	

	computePlayerHand(suitFrequency: MapSchema<number>, cardFrequency: MapSchema<number>, cardsToBeUsed: Array<Card>, sortCard: ArraySchema<number> ) {

		console.log("cardfreq"+JSON.stringify(cardFrequency) + " "+ "suitfreq"+JSON.stringify(suitFrequency));
		const trail = this.isTrail(cardFrequency);
		const color = this.isColor(suitFrequency);
		console.log("Color-=->"+JSON.stringify(color));
		
		const straightRes = this.isStraight(sortCard);
		
		const pureSequence = this.isPureSequence(sortCard, color.isColor);
		
		const frequencyRes = this.computeFrequency(cardsToBeUsed, cardFrequency);

		// console.log(`isTrail: ${trail.isTrail} cards: ${JSON.stringify(cardFrequency)}`);
		
		// console.log(`isColor: ${color.isColor}`);
		
		// console.log(`isOnePair: ${frequencyRes.isPair}`);
		// console.log(`==================================================`);

		let bestHand: Array<Card> = new Array<Card>();
		let hand: string = undefined;

		if(trail.isTrail) {
			hand = `Trail`;
		}

		else if(pureSequence) {
			hand = `Pure Sequence`;
		}

		else if(straightRes) {
			hand = `Sequence`;
		}
	
		else if(color.isColor) {
			hand = `Color`;
		} 

		else if(frequencyRes.isPair) {
			hand = `Pair`;
		}

		else {
			cardsToBeUsed.slice(0, 3).forEach((card) => {
				bestHand.push(card);
			});
			hand = `HighCard`;
		}
		return { bestHand: bestHand, hand: hand };
	}


	isTrail(cardFrequency: MapSchema<number>) {
		let isTrail = false
		cardFrequency.forEach((value, key) =>  {
			if(value === 3) {
				isTrail = true;
				return {isTrail};
			}
		});
		return {isTrail};
	}

	isPureSequence(cards: ArraySchema<number>, color: boolean) {
		if(!cards) {
			return { isStraightFlush: false, isLowStraightFlush: false };
		}
		const straightRes = this.isStraight(cards);
		if (straightRes && color) {
			return true;
		} else return false;
	}

	isStraight(cards: ArraySchema<number>) {
		return this.checkStraight(cards, false);
	}

	checkStraight(cards: ArraySchema<number>, forLow: boolean) {
		let seq = false;
		for (let i = 0; i < cards.length; i++) {
			if (i == 0) {}	
			else {
				
				if(cards.at(2)==13 && cards.at(1)==2 && cards.at(0)==1)
				{
					seq = true;
					return seq;
				}
				else if (cards.at(i) - cards.at(i - 1) == 1 && cards.at(i + 1) - cards.at(i) == 1)
				{
					seq = true;
					return seq;
				} else 
				{
					seq = false;
					return seq;
				}
			}	
		}	
	}

	isColor(suitFrequency: MapSchema<number>) {
		let isColor = false;
		suitFrequency.forEach((value, key) =>  {
			if(value === 3) {
				isColor = true;
				console.log("-=-=-=value-=-=->"+value);
				return {isColor, flushSuit: key};
			}
		});
		return {isColor, flushSuit: null};
	}

	isPair(suitFrequency: MapSchema<number>) {
		for(let suit in suitFrequency) {
			if(suitFrequency[suit] === 2) {
				return {isPair: true, flushSuit: suit};
			}
		}
		return {isPair: false, flushSuit: null};
	}

	computeFrequency(cards: Array<Card>, cardFrequency: MapSchema<number>) {
		
		let isPair = false;
		let pairs: Array<number> = new Array<number>();
		
		cardFrequency.forEach((value, key) =>  {
			if (value === 2) {
				isPair = true;
				pairs.push(Number(key));
			}
		});
		// Ensure histogram arrays are sorted in descending order to build best hand top down
		pairs = pairs.sort((a,b) => b - a);
		
		return { isPair, pairs };
	}

	copyCards(cards: Array<Card>) : Array<Card> {
		let copyCards: Array<Card> = new Array<Card>();
		cards.forEach((card) => {
			let newCard: Card = new Card();
			newCard.num = card.num;
			newCard.suit = card.suit;
			// newCard.isHole = card.isHole;
			copyCards.push(newCard);
		});
		return copyCards;
	}

	filterIndexCard(cards: Array<Card>, skipIndex: number) : Array<Card> {
		let copyCards: Array<Card> = new Array<Card>();
		for(let i = 0; i < cards.length; i++) {
			if(i !== skipIndex) {
				let newCard: Card = new Card();
				newCard.num = cards[i].num;
				newCard.suit = cards[i].suit;
				// newCard.isHole = cards[i].isHole;
				copyCards.push(newCard);
			}
		}
		return copyCards;
	}

	getSuitCards(cards: Array<Card>, suit: string) : Array<Card> {
		let copyCards: Array<Card> = new Array<Card>();
		cards.forEach((card) => {
			if(card.suit === suit) {
				let newCard: Card = new Card();
				newCard.num = card.num;
				newCard.suit = card.suit;
				// newCard.isHole = card.isHole;
				copyCards.push(newCard);
			}
		});
		return copyCards;
	}
}