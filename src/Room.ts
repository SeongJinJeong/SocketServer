import {app} from "./index";
import {PacketCreateRoom} from "./netHandler";
import {Server, Socket} from "socket.io";
import Player from "./Player";
import Util from "./Util";

class Room implements PacketCreateRoom {
    io: Server = null;
    socket: Socket = null;
    players: Player[] = null;

    public roomid: string = null;
    public roomName: string = null;

    constructor(roomid?: string, roomName?: string) {
        this.io = app.get("io");
        this.socket = app.get("socket");

        this._init(roomid, roomName);
    }

    private _init(roomid, roomName): void {
        this.roomid = roomid;
        this.roomName = roomName;
        this.players = [];
    }

    public getRoomID(): string {
        return this.roomid;
    }

    public getRoomData(): { roomid: string, roomName?: string, playerCount?: number } {
        return {
            roomid: this.roomid,
            roomName: this.roomName,
            playerCount: this.players.length
        }
    }

    public getRoomPlayers(): Player[] {
        return this.players;
    }

    public join(player: Player) {
        if (this.players.indexOf(player) === -1) {
            this.onNewPlayerJoinRoom(player);
        }
    }

    private onNewPlayerJoinRoom(player: Player): void {
        this.players.push(player);
        player.getSocket().broadcast.to(this.roomid).emit("onMsg", Util.generateResponse(false, {
            msg: "New User Joined!",
            playerName : player.getPlayerData().name
        }));
    }

    public leave(player: Player): void {
        const index = this.players.indexOf(player);
        if (index !== -1) {
            this.onUserLeaveRoom(index);
        }
    }

    private onUserLeaveRoom(index: number): void {
        this.players[index].getSocket().broadcast.to(this.roomid).emit("onMsg", Util.generateResponse(false,{
            msg: "User Leaved!",
            playerName: this.players[index].getPlayerData().name
        }));
        this.players[index] = null;
        this.players = this.players.filter(p => p);
    }
}

export default Room;