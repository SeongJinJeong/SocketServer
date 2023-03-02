import {Socket, Server} from "socket.io";
import {app} from "./index";
import Room from "./Room";
import room from "./Room";
import RoomManager from "./RoomManager";
import Player, {PlayerContainer} from "./Player";
import * as crypto from "crypto";
import LobbyRoom from "./LobbyRoom";
import Util from "./Util";

interface PacketEntry {
    playerID: number
    currentRoom: string
    playerName: string
}

export interface PacketCreateRoom {
    roomid: string,
    roomName: string,
}

class NetHandler {
    io: Server = null;
    socket: Socket = null;
    player: Player = null;

    constructor(io: Server, socket: Socket) {
        this.io = io;
        this.socket = socket;
        app.set('io', this.io);
        app.set('socket', this.socket);

        this._initListener();
    }
    private _initListener(): void {
        this.addListener("disconnect", this.onDisconnect.bind(this));

        this.addListener("onLogin", this.onLogin.bind(this));
        this.addListener("onEnterLobby", this.onEnterLobby.bind(this));
        this.addListener("onGetLobbyRooms",this.onGetLobbyRooms.bind(this));
        this.addListener("onEnterGameRoom",this.onEnterGameRoom.bind(this));
        this.addListener("onLeaveGameRoom",this.onLeaveGameRoom.bind(this));
    }

    //region [ Listeners ]
    private onDisconnect(reason: string): void {
        console.log("Disconnected Default : " + JSON.stringify(reason));
        this.socket.disconnect();
        PlayerContainer.getInstance().removePlayer(this.player);
    }

    private onLogin(data: { name: string }): void {
        const id = crypto.getRandomValues(new Uint32Array(10)).toString();
        this.player = new Player(data.name, id);
        PlayerContainer.getInstance().addPlayer(this.player);
        this.emitLoginSucceed();
    }
    private onEnterLobby() : void {
        this.player.setIsLobby(true);
        console.log("Entered Lobby!");
    }
    private onGetLobbyRooms() : void {
        this.emitGetLobbyRooms();
    }
    private async onEnterGameRoom(msg) : Promise<void> {
        await this.player.joinRoom(msg.roomid, this.socket);
        this.emitGameRoomData(msg.roomid);
    }
    private async onLeaveGameRoom(msg) : Promise<void> {
        await this.player.leaveRoom(msg.roomid,this.io, this.socket);
        this.emitLeaveGameRoom(msg.roomid);
    }

    public addListener(event: string, cb: (...args: any[]) => void): void {
        this.socket.on(event, cb);
    }

    //endregion

    //region [ Emitters ]
    private emitLoginSucceed() : void {
        const player = this.player.getPlayerData();
        const data = Util.generateResponse(false, {
            name : player.name,
            id : player.playerID
        });

        this.emitEvent("loginSucceed",data);
    }
    private emitGetLobbyRooms() : void {
        let roomDataArr = [];
        LobbyRoom.getInstance().getAllRoom().forEach((room)=>{
            roomDataArr.push(room.getRoomData());
        });
        var data = Util.generateResponse(false, {rooms : roomDataArr});

        this.emitEvent("onGetLobbyRooms",data);
    }
    private emitGameRoomData(roomid : string) : void {
        const roomPlayers = LobbyRoom.getInstance().getRoom(roomid).getRoomPlayers().map(player=>{
            return {
                name : player.getPlayerData().name
            }
        });
        const roomData = LobbyRoom.getInstance().getRoom(roomid).getRoomData();
        const data = Util.generateResponse(false, {roomData, roomPlayers});

        this.emitEvent("onGameRoomData",data)
    }
    private emitLeaveGameRoom(roomid : string) : void {
        this.emitEvent("onLeaveGameRoom", Util.generateResponse(false));
    }

    private emitEvent(eventName : string, data : any) : void {
        this.socket.emit(eventName,data);
    }
    //endregion
}

export default NetHandler;