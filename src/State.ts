import { type, Schema, MapSchema, ArraySchema } from '@colyseus/schema';
import { Seatingstatus } from './Seatingstatus';

export class Card extends Schema {
    @type(`int32`)
    num: number;

    @type(`string`)
    suit: string;

    constructor(newNum?: number, newSuit?:string) {
        super();
        this.num = newNum;
        this.suit = newSuit;
    }
}

export class Player extends Schema {
    @type(`string`)
    id: string;
  
    @type([ Card ])
    cards: ArraySchema<Card> = new ArraySchema<Card>();

    @type([ Card ])
    bestHand: ArraySchema<Card> = new ArraySchema<Card>();

    @type(`string`)
    hand: string = undefined;

    @type(`int32`)
    blindsPerGame: number = 0;
  
    @type(`float32`)
    totalChips: number;
  
    @type(`float32`)
    currentBet: number;

    @type(`float32`)
    totalBet: number;

    @type(`boolean`)
    isBlind: boolean = true;

    @type(`int32`)
    Seatnumber :number ;

    @type(`boolean`)
    IsPack : boolean =  false;

    @type([Card])
    replacedCards : ArraySchema<Card> = new ArraySchema<Card>();

    @type(`boolean`)
    IsSS: boolean = false;

    @type(`int32`)
    newCardCount: number = 0;

    @type('string')
    Player_name: string;

    @type('int32')
    User_Id: number;

    @type('float32')
    User_Table_Amount:number;

    reset(){
    this.cards.splice(0,this.cards.length);
    this.bestHand.splice(0,this.bestHand.length);
    this.hand = undefined;
    this.blindsPerGame = 0;
    this.currentBet = 0;
    this.totalBet = 0;
    this.isBlind = true;
    this.IsPack = false;
    this.replacedCards.splice(0,this.replacedCards.length);
    this.IsSS = false;
    this.newCardCount = 0;
    }   
}
  
export class GameState extends Schema {
    @type({ map: Player })
    players :  MapSchema<Player> =  new MapSchema<Player>();

    @type(`int32`)
    activePlayerIndex: number;

    @type(`int32`)
    dealerIndex: number;

    @type(`float32`)
    minBet: number;

    @type(`float32`)
    currentBet: number;

    @type(`float32`)
    currentBetBlind: number;

    @type(`float32`)
    currentBetChaal: number;

    @type([ Player ])
    winningPlayers: ArraySchema<Player> = new ArraySchema<Player>();
    
    @type(`float32`)
    pot: number = 0;
    
    @type(`boolean`)
    isGameRunning: boolean = false;
      
    @type(`string`)
    phase: string;

    @type([Seatingstatus])
    Seatting: ArraySchema<Seatingstatus> = new ArraySchema<Seatingstatus>();

    @type(Card)
    jokerCard: Card = new Card();

    @type(`boolean`)
    IsShowPossible: boolean = false;

    @type(`int32`)
    Lobby_id: number = -1;

    @type(`int32`)
    Commission_Rate: number =0;

    reset()
    {
        this.players.forEach((value,key)=>value.reset());
        this.currentBet = 0;
        this.currentBetBlind = 0;
        this.currentBetChaal = 0;
        this.minBet = 0;
        this.winningPlayers.splice(0,this.winningPlayers.length);
        this.pot = 0;
        this.IsShowPossible = false;
    }
}

