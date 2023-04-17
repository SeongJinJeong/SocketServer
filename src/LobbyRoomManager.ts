import RoomManager from "./RoomManager";
import GameRoom from "./Game/GameRoom";
import {PacketGameInfo} from "./netHandler";
import {Server, Socket} from "socket.io";
import {app} from "./index"

class LobbyRoomManager extends RoomManager {
    private static instance: LobbyRoomManager = null;

    static getInstance(): LobbyRoomManager {
        if (this.instance !== null)
            return this.instance;

        this.instance = new LobbyRoomManager();
        return this.instance;
    }

    gameRooms : GameRoom[] = null;
    io : Server = null;
    socket : Socket = null;
    constructor() {
        super();
        this.gameRooms = [];
        this.io = app.get("io");
        this.socket = app.get("socket");
    }

    public createGameRoom(msg: PacketGameInfo): void {
        const room = new GameRoom(msg.roomid);
        room.initGameRoom(this.getRoom(msg.roomid).getRoomPlayers(), msg);
        this.gameRooms.push(room);
    }

    public getGameRoom(roomid : string) : GameRoom {
        return this.gameRooms.find(room => room.getRoomID() === roomid);
    }
}
export default LobbyRoomManager;