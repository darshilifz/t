import { Player } from "../State";
import { MapSchema, ArraySchema } from '@colyseus/schema';

//Utility class for Cards
export class PlayerUtils {
  rankByHand = [
    `Trail`,
    `Pure Sequence`,
    `Sequence`,
    `Color`,
    `Pair`,
    `HighCard`
  ];

  getRandomPlayer(totalPlayers: number): number {
    let randomPlayer = Math.random() * Math.floor(totalPlayers);
    return Math.floor(randomPlayer);
  }

  determineWinners(players: MapSchema<Player>): ArraySchema<Player> {
    let winningPlayers: string[] = [];
    let winningHand: number = -1;
    players.forEach((value, key) =>
    {
      console.log(`Player id ${value.id} and hand ${value.hand}`);
      if (winningHand === -1) {
        winningHand = this.rankByHand.indexOf(value.hand);
        winningPlayers.push(key);
        console.log(`1 WinningPlayerIndex ${JSON.stringify(winningPlayers)}`);
        //continue;
      }
      else {
        let curWinningHand: number = this.rankByHand.indexOf(value.hand);
        if (curWinningHand <= winningHand) {
          if (curWinningHand === winningHand) {
            winningPlayers.push(key);
            console.log(`2 WinningPlayerIndex ${JSON.stringify(winningPlayers)}`);
          } else {
            winningPlayers.splice(0, winningPlayers.length);
            winningHand = curWinningHand;
            winningPlayers.push(key);
            console.log(`3 WinningPlayerIndex ${JSON.stringify(winningPlayers)}`);
          }
        }
      }
    });
    console.log("-=-=-=winningPlayers-=-=-=->");
    console.log(winningPlayers)

    let winners: ArraySchema<Player> = new ArraySchema<Player>();
    let previousCards: MapSchema<any> = new MapSchema<any>();
    let sortPrevious: Array<any> = new Array<any>();
    let sameCards: ArraySchema<any> = new ArraySchema<any>();
    let sortCards: ArraySchema<number> = new ArraySchema<number>();

    //#region old code
    // if (winningPlayers.length > 1) 
    // {
    //   for (let i = 0; i < winningPlayers.length; i++) 
    //   {
    //     //old code
    //     sortCards.length = 0;

    //     //new code
    //     sortCards.splice(0, sortCards.length);
    //     //console.log("-=-=-=-sortCards=-=-=-=->"+sortCards.length);

    //     //Adding the cards to the sortcards 
    //     for (let j = 0; j < players[winningPlayers[i]].cards.length; j++) {
    //       sortCards.push(players[winningPlayers[i]].cards[j].num);
    //     }
    //     sortCards.sort((a, b) => { return b - a });
    //     console.log(sortCards);

    //     if (players[winningPlayers[i]].hand == 'Pair') 
    //     {
    //       for (var j = 0; j < sortCards.length - 1; j++) 
    //       {
    //         if (sortCards[j + 1] === sortCards[j]) 
    //         {
    //           previousCards[players[winningPlayers[i]].id] = sortCards[j];
    //         }
    //       }
    //     } else {
    //       previousCards[players[winningPlayers[i]].id] = sortCards[0];
    //     }
    // }


    //   for (var k in previousCards) {
    //     sortPrevious.push([k, previousCards[k]]);
    //   }
    //   sortPrevious.sort(function (a, b) { return b[1] - a[1]; });
    //   console.log("-=-=-=-sortPrevious=-=-=-=-=>");
    //   console.log(sortPrevious);

    //   if (sortPrevious[0][1] === sortPrevious[1][1]) 
    //   {
    //     for (let k = 0; k < sortPrevious.length - 1; k++) {
    //       if (sortPrevious[0][1] === sortPrevious[k + 1][1]) {
    //         sameCards.push(sortPrevious[k]);
    //         sameCards.push(sortPrevious[k + 1]);
    //       }
    //     }

    //     sortPrevious.length = 0;

    //     previousCards = new MapSchema();

    //     for (let i = 0; i < sameCards.length; i++) {
    //       sortCards.length = 0;

    //       for (const playerId in players) {
    //         if (players[playerId].id === sameCards[i][0]) {
    //           for (let j = 0; j < 3; j++) {
    //             sortCards.push(players[playerId].cards[j].number);
    //             sortCards.sort((a, b) => { return b - a });
    //           }
    //           previousCards[sameCards[i][0]] = sortCards[1];
    //         }
    //       }
    //     }
    //     for (var k in previousCards) {
    //       sortPrevious.push([k, previousCards[k]]);
    //     }
    //     sortPrevious.sort(function (a, b) { return b[1] - a[1]; });

    //     if (sortPrevious[0][1] === sortPrevious[1][1]) {
    //       for (let k = 0; k < sortPrevious.length - 1; k++) {
    //         if (sortPrevious[0][1] === sortPrevious[k + 1][1]) {
    //           sameCards.push(sortPrevious[k]);
    //           sameCards.push(sortPrevious[k + 1]);
    //         }
    //       }

    //       sortPrevious.length = 0;

    //       previousCards = new MapSchema();

    //       for (let i = 0; i < sameCards.length; i++) {
    //         sortCards.length = 0;

    //         for (const playerId in players) {
    //           if (players[playerId].id === sameCards[i][0]) {
    //             for (let j = 0; j < 3; j++) {
    //               sortCards.push(players[playerId].cards[j].number);
    //               sortCards.sort((a, b) => { return b - a });
    //             }
    //             previousCards[sameCards[i][0]] = sortCards[2];
    //           }
    //         }
    //       }
    //       for (var k in previousCards) {
    //         sortPrevious.push([k, previousCards[k]]);
    //       }
    //       sortPrevious.sort(function (a, b) { return b[1] - a[1]; });

    //     } else {
    //       for (const playerId in players) {
    //         if (players[playerId].id === sortPrevious[0][0]) {
    //           winners.push(players[playerId]);
    //           console.log(`Winning Player ${JSON.stringify(winners)}`);
    //         }
    //       }
    //     }
    //   } else {
    //     for (const playerId in players) {
    //       if (players[playerId].id === sortPrevious[0][0]) {
    //         winners.push(players[playerId]);
    //         console.log(`Winning Player ${JSON.stringify(winners)}`);
    //       }
    //     }
    //   }
    // }
    //#endregion

    //#region 
    if (winningPlayers.length > 1) 
    {
      for (let i = 0; i < winningPlayers.length; i++) {
        //new code
        sortCards.splice(0, sortCards.length);

        //Adding the cards to the sortcards 
        for (let j = 0; j < players.get(winningPlayers[i]).cards.length; j++)
        {
          sortCards.push(players.get(winningPlayers[i]).cards[j].num);
        }
        sortCards.sort((a, b) => { return b - a });
        
        let newlist = [...sortCards];
        console.log(newlist);
        sortPrevious.push([players.get(winningPlayers[i]).id , newlist])
      }
     
      console.log(players.get(winningPlayers[0]).hand);
      
      
      switch(players.get(winningPlayers[0]).hand)
      {
        case `HighCard`:
          
          sortPrevious.sort(this.TwoDSorter);
          
          //Adding first player
          winners.push(players.get(sortPrevious[0][0]));
          
          for (let i = 1; i < sortPrevious.length; i++) {
            if( JSON.stringify(sortPrevious[0][1])===JSON.stringify(sortPrevious[i][1]))
            {
              winners.push(players.get(sortPrevious[i][0]));
            }  
          }
          //console.log(JSON.stringify(winners));
          break;
          
          case `Pair`:
            
            for (let i = 0; i < sortPrevious.length; i++) {
              if(sortPrevious[i][1][0]!=sortPrevious[i][1][1])
              {
                let temp : number = sortPrevious[i][1][0];
                sortPrevious[i][1][0] = sortPrevious[i][1][2];
                sortPrevious[i][1][2] = temp;
              }
            }
            
            sortPrevious.sort(this.TwoDSorter);
          
          console.log(sortPrevious);

          //Adding first player
          winners.push(players.get(sortPrevious[0][0]));

          for (let i = 1; i < sortPrevious.length; i++) {
            if( JSON.stringify(sortPrevious[0][1])===JSON.stringify(sortPrevious[i][1]))
            {
              winners.push(players.get(sortPrevious[i][0]));
            }  
          }
         // console.log(JSON.stringify(winners));
          break;
        case `Color`:

          sortPrevious.sort(this.TwoDSorter);
          console.log(sortPrevious);

          //Adding first player
          winners.push(players.get(sortPrevious[0][0]));

          for (let i = 1; i < sortPrevious.length; i++) {
            if( JSON.stringify(sortPrevious[0][1])===JSON.stringify(sortPrevious[i][1]))
            {
              winners.push(players.get(sortPrevious[i][0]));
            }  
          }
          //console.log(JSON.stringify(winners));


          break;
        case `Sequence`:

          sortPrevious.sort(this.TwoDSorter);
          console.log(sortPrevious);

          //Adding first player
          winners.push(players.get(sortPrevious[0][0]));

          for (let i = 1; i < sortPrevious.length; i++) {
            if( JSON.stringify(sortPrevious[0][1])===JSON.stringify(sortPrevious[i][1]))
            {
              winners.push(players.get(sortPrevious[i][0]));
            }  
          }
          console.log(JSON.stringify(winners));
          break;
        
         case `Pure Sequence`:

          sortPrevious.sort(this.TwoDSorter);
          console.log(sortPrevious);

          //Adding first player
          winners.push(players.get(sortPrevious[0][0]));

          for (let i = 1; i < sortPrevious.length; i++) {
            if( JSON.stringify(sortPrevious[0][1])===JSON.stringify(sortPrevious[i][1]))
            {
              winners.push(players.get(sortPrevious[i][0]));
            }  
          }
          console.log(JSON.stringify(winners));
          break;

          case `Trail`:

            sortPrevious.sort(this.TwoDSorter);
            console.log(sortPrevious);
  
            //Adding first player
            winners.push(players.get(sortPrevious[0][0]));
  
            for (let i = 1; i < sortPrevious.length; i++) {
              if( JSON.stringify(sortPrevious[0][1])===JSON.stringify(sortPrevious[i][1]))
              {
                winners.push(players.get(sortPrevious[i][0]));
              }  
            }
            console.log(JSON.stringify(winners));
            break;
      }
    //  console.log("-=-=-=-sortPrevious=-=-=-=-=>");

    }
    //#endregion
    else {
      for (let i = 0; i < winningPlayers.length; i++) {
        //console.log(`Winning Index: ${winningPlayers[i]}`);
        winners.push(players.get(winningPlayers[i]));
        console.log(`Winning Player ${JSON.stringify(winners)}`);
      }
    }
    return winners;
  }

  TwoDSorter(a,b){
    if (b[1][0] < a[1][0] || b[1][0] == a[1][0]) 
            {
              if (b[1][0] == a[1][0]) 
              {
                if (b[1][1] < a[1][1] || b[1][1] == a[1][1]) 
                {
                  if (b[1][1] == a[1][1]) 
                  {
                    if (b[1][2] < a[1][2] || b[1][2] == a[1][2]) 
                    {
                      if (b[1][2] == a[1][2]) 
                      {
                        return 0;
                      }
                      else 
                      {
                        return -1;
                      }
                    }
                  }
                  else 
                  {
                    return -1;
                  }
                }
              }
              else {
                return -1;
              }
            }
    
            else if (b[1][0] > a[1][0] || b[1][0] == a[1][0]) 
            {
              if (b[1][0] == a[1][0]) 
              {
                if (b[1][1] > a[1][1] || b[1][1] == a[1][1]) 
                {
                  if (b[1][1] == a[1][1]) 
                  {
                    if (b[1][2] > a[1][2] || b[1][2] == a[1][2]) 
                    {
                      if (b[1][2] == a[1][2]) 
                      {
                        return 0;
                      }
                      else 
                      {
                        return 1;
                      }
                    }
                  }
                  else 
                  {
                    return 1;
                  }
                }
              }
              else {
                return 1;
              }
            }
            else
              return 0;
  }
}