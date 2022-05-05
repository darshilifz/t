export class metadata
{
    Room_name: string;
    Room_password: string;
    owner_id : number;
    club_id: number;
    lobby_id: number;

    constructor()
    {
        this.Room_name = "";
        this.Room_password = "";
        this.owner_id = -1;
        this.club_id = -1;
        this.lobby_id = -1;
    }

    Setvalue(Room_name : string , Room_password : string ,owner_id : number , club_id :number, lobby_id:number)
    {
        this.Room_name = Room_name;
        this.Room_password = Room_password;
        this.owner_id = owner_id;
        this.club_id = club_id;
        this.lobby_id = lobby_id;
    }
}