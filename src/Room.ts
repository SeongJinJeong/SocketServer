import {app} from "./index";
import {PacketCreateRoom} from "./netHandler";
import {Server, Socket} from "socket.io";
import Player from "./Player";

class Room implements PacketCreateRoom {
    io : Server = null;
    socket : Socket = null;
    players : Player[] = null;

    public roomid : string = null;
    public roomName : string = null;
    constructor(roomid? : string, roomName? : string) {
        this.io = app.get("io");
        this.socket = app.get("socket");

        this._init(roomid,roomName);
    }
    private _init(roomid, roomName) : void {
        this.roomid = roomid;
        this.roomName = roomName;
        this.players = [];
    }

    public getRoomID() : string {
        return this.roomid;
    }

    public getRoomData() : {roomid : string, roomName? : string, playerCount? : number} {
        return {
            roomid : this.roomid,
            roomName : this.roomName,
            playerCount : this.players.length
        }
    }

    public getRoomPlayers() : Player[] {
        return this.players;
    }

    public join(player : Player) {
        if(this.players.indexOf(player) === -1)
            this.players.push(player);
    }

    public leave(player : Player) : void {
        if(this.players.indexOf(player) !== -1){
            this.players[this.players.indexOf(player)] = null;
            this.players = this.players.filter(p => p);
        }
    }
}

export default Room;