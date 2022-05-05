import { type, Schema, MapSchema, ArraySchema } from '@colyseus/schema';
export class Seatingstatus extends Schema
{
    @type(`string`)
    Session_id: string;
    @type(`boolean`)
    Is_Playing: boolean;

    constructor()
    {
        super();
        this.Session_id = "-1";
        this.Is_Playing =false;
    }

    Setvalue(Session_id : string , Is_Playing : boolean)
    {
        this.Session_id = Session_id;
        this.Is_Playing = Is_Playing;
    }
}