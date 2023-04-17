import {app} from "./index";
import {Server, Socket} from "socket.io";
import Player from "./Player";
import Util from "./Util";
import LobbyRoomManager from "./LobbyRoomManager";

class Room {
    io: Server = null;
    players: Player[] = null;

    private roomid: string = null;
    private roomName: string = null;

    constructor(roomid?: string, roomName?: string) {
        this.io = app.get("io");
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

    public getRoomData(): { roomid: string, player : {[key:string] : any}  } {
        return {
            roomid: this.roomid,
            player : this.players.map((player)=>{
                return {
                    id : player.getPlayerData().playerID,
                    name : player.getPlayerData().name
                }
            })
        }
    }

    public getRoomPlayers(): Player[] {
        return this.players;
    }

    public async join(player: Player) {
        if (this.players.indexOf(player) === -1) {
            await this.onNewPlayerJoinRoom(player);
        }
    }

    private async onNewPlayerJoinRoom(player: Player) {
        this.players.push(player);
        await player.getSocket().join(this.getRoomID());
        player.getSocket().broadcast.to(this.roomid).emit("onMsg", Util.generateResponse(false, {
            msg: "New User Joined!",
            playerName : player.getPlayerData().name
        }));
    }

    public broadcast(eventName : string, msg : any, socket : Socket) : void {
        this.io.to(this.getRoomID()).emit(eventName, JSON.stringify(Util.generateResponse(false, {msg})));
    }

    public async leave(player: Player) {
        const index = this.players.indexOf(player);
        if (index !== -1) {
            await this.onUserLeaveRoom(index, player);
        }
    }

    private async onUserLeaveRoom(index: number, player : Player) {
        await player.getSocket().leave(this.getRoomID());
        await LobbyRoomManager.getInstance().leaveRoom(player.getJoinedRoom().getRoomID(), this.io);
        this.players[index].getSocket().broadcast.to(this.roomid).emit("onMsg", Util.generateResponse(false,{
            msg: "User Leaved!",
            playerName: this.players[index].getPlayerData().name
        }));
        this.players[index] = null;
        this.players = this.players.filter(p => p);
    }

    public async destroy() {
        await this._leaveAllUser();
        await this._removeFromManager();
    }

    private async _leaveAllUser() : Promise<void> {
        for(let i=0; i<this.players.length; i++){
            await this.players[i].getSocket().leave(this.getRoomID());
        }
    }

    private async _removeFromManager() : Promise<void> {
        await LobbyRoomManager.getInstance().leaveRoom(this.getRoomID(),this.io);
    }
}

export default Room;