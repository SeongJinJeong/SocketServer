import RoomManager from "../RoomManager";
import Room from "../Room";

class GameRoomManager extends RoomManager {
    private static instance : GameRoomManager = null;
    public static getInstance() : GameRoomManager {
        if(!this.instance){
            this.instance = new GameRoomManager();
        }

        return this.instance;
    }

    public override createRoom(roomid: string): Room {
        return super.createRoom(roomid);
    }
}