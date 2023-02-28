import RoomManager from "./RoomManager";
import Room from "./Room";
import Player from "./Player";

class LobbyRoom extends RoomManager {
    private static instance: LobbyRoom = null;

    static getInstance(): LobbyRoom {
        if (this.instance !== null)
            return this.instance;

        this.instance = new LobbyRoom();
        return this.instance;
    }

    constructor() {
        super();
    }
}

export default LobbyRoom;