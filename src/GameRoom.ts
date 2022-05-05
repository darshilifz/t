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
import { BaseRoom } from './BaseRoom';
const routes = require('../dbscripts/src/routes');

export class GameRoom extends BaseRoom
{
}
