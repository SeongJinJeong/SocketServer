import {Server, Socket} from "socket.io";
import {app} from "./index";
import Player, {PlayerContainer} from "./Player";
import * as crypto from "crypto";
import LobbyRoomManager from "./LobbyRoomManager";
import Util from "./Util";
import GameRoomManager from "./Game/GameRoomManager";
import {BetType} from "./Game/GameController";

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
        this.addListener("onGetPlayerData",this.onGetPlayerData.bind(this));
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

    private onLogin(msg : PacketOnLogin): void {
        let id = "";
        while (true) {
            id = crypto.webcrypto.getRandomValues(new Uint32Array(1)).toString();
            if (PlayerContainer.getInstance().checkIDValidate(id))
                break;
        }

        this.player = new Player(msg.name, id, this.socket);
        PlayerContainer.getInstance().addPlayer(this.player);
        this.emitLoginSucceed();
    }

    private onEnterLobby(msg : PacketOnEnterLobby): void {
        this.player.setIsLobby(true);
        console.log("Entered Lobby!");
        this.emitEnterLobbySucceed();
    }

    private onGetLobbyRooms(msg : PacketOnGetLobbyRooms): void {
        this.emitGetLobbyRooms();
    }

    private async onEnterRoom(msg : PacketOnEnterRoom): Promise<void> {
        await this.player.joinRoom(msg.roomid);
        this.emitGetRoomData();
    }

    private onGetRoomData(msg : PacketOnGetRoomData) : void {
        this.emitGetRoomData();
    }

    private onGetPlayerData(msg : PacketOnGetPlayerData) : void {
        this.emitGetPlayerData();
    }

    private onChatRoom(msg: PacketOnChatRoom): void {
        this.player.getJoinedRoom().broadcast("broadcast",{msg : msg.msg}, this.player.getSocket());
    }

    private async onLeaveRoom(msg : PacketOnLeaveRoom): Promise<void> {
        await this.player.leaveRoom();
        this.emitLeaveRoom();
    }


    // emit gameStart
    private async onGameStart(msg: PacketGameInfo): Promise<void> {
        // Destroy Lobby Room
        const players = this.player.getJoinedRoom().getRoomPlayers();
        await this.player.getJoinedRoom().destroy();
        // And Create Game Room
        const gameRoom = await GameRoomManager.getInstance().createRoom(msg.roomid);
        await gameRoom.initGameRoom(players,msg);
        gameRoom.getManager().onGameStart();
        
    }

    private onPlayerReady(msg: PacketOnPlayerReady): void {
        GameRoomManager.getInstance().getRoom(this.player.getJoinedRoom().getRoomID()).getManager().playerReady();
    }

    private onPlayerBet(msg: PacketOnPlayerBet): void {
        const manager = GameRoomManager.getInstance().getRoom(this.player.getJoinedRoom().getRoomID()).getManager();
        switch (msg.betType.toLowerCase()) {
            case "half" :
                manager.playerBet(BetType.Half, this.player);
                break;
            case "call":
                manager.playerBet(BetType.Call, this.player);
                break;
            case "check":
                manager.playerBet(BetType.Check, this.player);
                break;
            case "allin":
                manager.playerBet(BetType.All_In, this.player);
                break;
            case "fold":
                manager.playerBet(BetType.Fold, this.player);
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
            console.log("Not Json types:"+data);
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

    private emitGetRoomData(): void {
        const roomData = this.player.getJoinedRoom().getRoomData();
        const data = Util.generateResponse(false, {roomData});

        this.emitEvent("onGameRoomData", data);
    }
    
    private emitGetPlayerData() : void {
        const playerData = this.player.getPlayerData();
        const data = Util.generateResponse(false, {playerData});
        this.emitEvent("onGetPlayerData",data);
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