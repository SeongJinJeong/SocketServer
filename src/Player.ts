import Room from "./Room";
import RoomManager from "./RoomManager";
import {Server, Socket} from "socket.io";
import LobbyRoom from "./LobbyRoom";

export interface PlayerData {
    name : string
    playerID : string
    joinedRoom? : Room[]
}
class Player {
    private isLobby : boolean = false;
    private name: string = null;
    private playerID: string = null;
    private joinedRoom: Room[] = null;

    constructor(name: string, playerID: string) {
        this.name = name;
        this.playerID = playerID;
        this.joinedRoom = [];
    }

    public getPlayerData() : PlayerData {
        return {
            name : this.name,
            playerID : this.playerID
        }
    }

    public async joinRoom(roomid: string, socket : Socket): Promise<boolean> {
        let room = LobbyRoom.getInstance().getRoom(roomid);
        if(!!room){
            if(this.getJoinedRoom(room.getRoomID())){
                console.log("Already joined the Room!");
                return false;
            }

            this.joinedRoom.push(room);
            room.join(this);
        } else {
            room = LobbyRoom.getInstance().createRoom(roomid);
            this.joinedRoom.push(room);
            room.join(this);
        }

        await socket.join(roomid);

        return true;
    }

    public async leaveRoom(roomid: string, io : Server): Promise<void> {
        const room = this.getJoinedRoom(roomid);

        if (!room)
            console.log("Player is not in the room" + room.getRoomID());
        else {
            room.leave(this);
            await LobbyRoom.getInstance().leaveRoom(roomid,io);
            this.joinedRoom[this.joinedRoom.indexOf(room)] = null;
            this.joinedRoom = this.joinedRoom.filter(v => v);
        }
    }

    public getJoinedRoom (roomid : string) : Room {
        return this.joinedRoom.find(room => room.getRoomID() === roomid);
    }

    public setIsLobby(isLobby : boolean) : void {
        this.isLobby = isLobby;
    }
}

export class PlayerContainer {
    public static getInstance(): PlayerContainer {
        if (this.instance)
            return this.instance;

        this.instance = new PlayerContainer();
        return this.instance;
    }

    private static instance: PlayerContainer = null;

    players: Player[] = null;

    constructor() {
        this.players = [];
    }

    public addPlayer(player: Player): void {
        this.players.push(player);
        console.log("Player Count : " + this.players.length);
    }

    public removePlayer(player: Player): void {
        const index = this.players.indexOf(player);
        if (index !== -1) {
            this.players[index] = null;
            this.players = this.players.filter(p => p);
        }

        console.log("Current Player Count : "+this.players.length);
    }
}

export default Player;