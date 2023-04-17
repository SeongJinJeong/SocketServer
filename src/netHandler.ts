import {Server, Socket} from "socket.io";
import {app} from "./index";
import Player, {PlayerContainer} from "./Player";
import * as crypto from "crypto";
import LobbyRoomManager from "./LobbyRoomManager";
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

export interface PacketGameInfo {
    roomid: string
    budgetPerPlayer: number
    playerCount: number
    timer: number
    entryFee : number
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
        this._initRoomListeners();
        this._initGameListeners();
    }

    private _initRoomListeners(): void {
        this.addListener("onLogin", this.onLogin.bind(this));
        this.addListener("onEnterLobby", this.onEnterLobby.bind(this));
        this.addListener("onGetLobbyRooms", this.onGetLobbyRooms.bind(this));
        this.addListener("onGetRoomData",this.onGetRoomData.bind(this));
        this.addListener("onEnterRoom", this.onEnterRoom.bind(this));
        this.addListener("onChatRoom", this.onChatRoom.bind(this));
        this.addListener("onLeaveRoom", this.onLeaveRoom.bind(this));
    }

    private _initGameListeners(): void {
        this.addListener("onGameStart", this.onGameStart.bind(this));
        this.addListener("onPlayerReady", this.onPlayerReady.bind(this));
        this.addListener("onPlayerBet", this.onPlayerBet.bind(this));
    }

    //region [ Listeners ]
    private onDisconnect(reason: string): void {
        console.log("Disconnected Default : " + JSON.stringify(reason));
        this.socket.disconnect();
        if (!!this.player)
            PlayerContainer.getInstance().removePlayer(this.player);
    }

    private onLogin(data: { name : string }): void {
        let id = "";
        while (true) {
            id = crypto.webcrypto.getRandomValues(new Uint32Array(1)).toString();
            if (PlayerContainer.getInstance().checkIDValidate(id))
                break;
        }

        this.player = new Player(data.name, id, this.socket);
        PlayerContainer.getInstance().addPlayer(this.player);
        this.emitLoginSucceed();
    }

    private onEnterLobby(): void {
        this.player.setIsLobby(true);
        console.log("Entered Lobby!");
        this.emitEnterLobbySucceed();
    }

    private onGetLobbyRooms(): void {
        this.emitGetLobbyRooms();
    }

    private async onEnterRoom(msg): Promise<void> {
        await this.player.joinRoom(msg.roomid);
        this.emitRoomData(this.player.getJoinedRoom().getRoomID());
    }

    private onGetRoomData(msg) : void {
        this.emitRoomData(msg.roomid);
    }

    private onChatRoom(data: { msg: string, roomid: string }): void {
        this.player.getJoinedRoom().broadcast("broadcast",{msg : data.msg}, this.player.getSocket());
    }

    private async onLeaveRoom(): Promise<void> {
        await this.player.leaveRoom();
        this.emitLeaveRoom();
    }


    // emit gameStart
    private async onGameStart(msg: PacketGameInfo): Promise<void> {
        await this.player.getJoinedRoom().destroy();
        LobbyRoomManager.getInstance().createGameRoom(msg);
        LobbyRoomManager.getInstance().getGameRoom(msg.roomid).getManager().onGameStart();
    }

    private onPlayerReady(msg: { roomid: string }): void {
        LobbyRoomManager.getInstance().getGameRoom(msg.roomid).getManager().playerReady();
    }

    private onPlayerBet(msg: { roomid: string, betType: string }): void {
        const manager = LobbyRoomManager.getInstance().getGameRoom(msg.roomid).getManager();
        switch (msg.betType.toLowerCase()) {
            case "half" :
                manager.betHalf(this.player);
                break;
            case "call":
                manager.betCall(this.player);
                break;
            case "allin":
                manager.betAllIn(this.player);
                break;
            case "die":
                break;
            default:
                console.error("INVALID BET TYPE!");
                break;
        }
    }

    public parser(cb : any, data : any) : any {
        // 데이터가 string 으로 오면 파싱해줌.
        let parsedData = null;
        try {
            parsedData = typeof data === "string" ? JSON.parse(data) : data;
        } catch (err) {
            console.log("Not Json Data:"+data);
        }
        return cb(parsedData);
    }
    public addListener(event: string, cb: (...args: any[]) => void): void {
        this.socket.on(event, this.parser.bind(this, cb));
    }

    //endregion

    //region [ Emitters ]
    private emitLoginSucceed(): void {
        const player = this.player.getPlayerData();
        const data = Util.generateResponse(false, {
            name: player.name,
            id: player.playerID
        });

        this.emitEvent("loginSucceed", data);
    }

    private emitEnterLobbySucceed() : void {
        this.emitEvent("onEnterLobbySucceed",Util.generateResponse(false, {}));
    }

    private emitGetLobbyRooms(): void {
        let roomDataArr = [];
        LobbyRoomManager.getInstance().getAllRoom().forEach((room) => {
            roomDataArr.push(room.getRoomData());
        });
        var data = Util.generateResponse(false, {rooms: roomDataArr});

        this.emitEvent("onGetLobbyRooms", data);
    }

    private emitRoomData(roomid: string): void {
        const roomData = this.player.getJoinedRoom().getRoomData();
        const data = Util.generateResponse(false, {roomData});

        this.emitEvent("onGameRoomData", data);
    }

    private emitLeaveRoom(): void {
        this.emitEvent("onLeaveRoom", Util.generateResponse(false));
    }

    private emitEvent(eventName: string, data: any): void {
        this.socket.emit(eventName, JSON.stringify(data));
    }

    //endregion
}

export default NetHandler;