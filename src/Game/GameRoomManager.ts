import RoomManager from "../RoomManager";
import Room from "../Room";
import GameRoom from "./GameRoom";

class GameRoomManager extends RoomManager {
    private static instance : GameRoomManager = null;
    public static getInstance() : GameRoomManager {
        if(!this.instance){
            this.instance = new GameRoomManager();
        }

        return this.instance;
    }

    rooms : GameRoom[] = null;
    constructor() {
        super();
    }
    public createRoom(roomid: string) : GameRoom {
        let room = this.rooms.find((roomData) => {
            return roomData.getRoomID() === roomid;
        });
        if (!!room)
            return room as GameRoom;

        room = new GameRoom(roomid);
        this.rooms.push(room);

        return room as GameRoom;
    }
    
    public override getRoom(roomid: string): GameRoom {
        return super.getRoom(roomid) as GameRoom;
    }
}

export default GameRoomManager;