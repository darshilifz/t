//Class to maintain all configuration related details per pokerType
export class GameConfig {
    minPlayers: number = undefined;

    holeCards: number = undefined;

    holeCardsToBeUsed: number = undefined;

    maxBlind: number = undefined;

    maxBetLimit: number = undefined;

    maxPotLimit: number = undefined;

    minBet: number = undefined;

    betDoubleInRound: string = undefined;

    cardCost: number = undefined;
    
    table_Max_Amount: number = undefined;
    

    setupConfig(option?:any) {
        this.minPlayers = 2;
        this.holeCards = (option.Customoptions.type.substring(0,2) == "OR") ? 3 : 4;
        this.maxBlind = 3;
        this.minBet = option.Customoptions.bootAmount;
        this.maxPotLimit = option.Customoptions.maxPotLimit;
        this.maxBetLimit = option.Customoptions.maxBet;
        this.cardCost = option.Customoptions.cardCost;
        this.table_Max_Amount = option.Customoptions.maxBet;
        // this.BootAmountper = 5;
    }
    // setupRoyalMConfig() {
    //     this.minPlayers = 2;
    //     this.holeCards = 4;
    //     this.maxBlind = 3;
    //     this.minBet = 50;
    //     this.maxPotLimit = 1000;
    //     this.maxBetLimit = 1000;
    //     this.BootAmountper = 5;
    //     this.cardCost = 0;
    //     this.table_Max_Amount = 100;
    // }
    // setupRoyalTDConfig() {
    //     this.minPlayers = 2;
    //     this.holeCards = 4;
    //     this.maxBlind = 3;
    //     this.minBet = 50;
    //     this.maxPotLimit = 1000;
    //     this.maxBetLimit = 1000;
    //     this.BootAmountper = 5;
    //     this.cardCost = 0;
    //     this.table_Max_Amount = 100;
    // }
}