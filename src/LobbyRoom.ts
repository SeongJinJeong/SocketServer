import RoomManager from "./RoomManager";
import GameRoom from "./Game/GameRoom";
import {PacketGameInfo} from "./netHandler";

class LobbyRoom extends RoomManager {
    private static instance: LobbyRoom = null;

    static getInstance(): LobbyRoom {
        if (this.instance !== null)
            return this.instance;

        this.instance = new LobbyRoom();
        return this.instance;
    }

    gameRooms : GameRoom[] = null;
    constructor() {
        super();
        this.gameRooms = [];
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

export default LobbyRoom;