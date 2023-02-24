import {EntryData} from "../@types/Entry";

class Player {
    playerID: number = -1;
    playerName: string = "";
    currentRoom: string = "";

    constructor(data: EntryData) {
        this.currentRoom = data.currentRoom;
        this.playerName = data.playerName;
        this.playerID = data.playerID;
    }

    public getAllData(): EntryData {
        return {
            playerID : this.playerID,
            playerName : this.playerName,
            currentRoom : this.currentRoom
        }
    }
}

export default Player;