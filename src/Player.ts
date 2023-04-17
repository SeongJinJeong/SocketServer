import Room from "./Room";
import RoomManager from "./RoomManager";
import {Server, Socket} from "socket.io";
import LobbyRoomManager from "./LobbyRoomManager";
import Util from "./Util";

class Player {
    private isLobby: boolean = false;
    private name: string = null;
    private playerID: string = null;
    private joinedRoom: Room = null;
    private socket: Socket = null;

    constructor(name: string, playerID: string, socket: Socket) {
        this.name = name;
        this.playerID = playerID;
        this.joinedRoom = null;
        this.socket = socket;
    }

    public getPlayerData(): PlayerData {
        return {
            name: this.name,
            playerID: this.playerID
        }
    }

    public async joinRoom(roomid: string): Promise<boolean> {
        let room = LobbyRoomManager.getInstance().getRoom(roomid);
        if (!!room) {
            const joinedRoom : Room = this.getJoinedRoom();
            if (!!joinedRoom && joinedRoom.getRoomID() === roomid) {
                console.log("Already joined the Room!");
                return false;
            }

            this.joinedRoom = room;
            await room.join(this);
        } else {
            room = LobbyRoomManager.getInstance().createRoom(roomid);
            this.joinedRoom = room;
            await room.join(this);
        }

        return true;
    }

    public async leaveRoom(): Promise<void> {
        const room = this.getJoinedRoom();

        if (!room)
            console.log("Player is not in the room");
        else {
            await room.leave(this);
            this.joinedRoom = null;
        }
    }

    public getJoinedRoom(): Room {
        return this.joinedRoom;
    }

    public setIsLobby(isLobby: boolean): void {
        this.isLobby = isLobby;
    }

    public getSocket(): Socket {
        return this.socket;
    }

    public broadToRoom(msg: string): void {
        this.getJoinedRoom().broadcast("broadcast",{msg}, this.socket);
    }
}

export class PlayerContainer {
    public static getInstance(): PlayerContainer {
        if (this.instance)
            return this.instance;

        this.instance = new PlayerContainer();
        return this.instance;
    }

    private static instance: PlayerContainer = null;

    players: Player[] = null;
    constructor() {
        this.players = [];
    }

    public addPlayer(player: Player): void {
        this.players.push(player);
        console.log(`New Player Login! \n Player Info \n ID : ${player.getPlayerData().playerID} \n Name : ${player.getPlayerData().name}`);
        console.log("Current Online Player Count : " + this.players.length);
    }

    public removePlayer(player: Player): void {
        const index = this.players.indexOf(player);
        if (index !== -1) {
            this.players[index] = null;
            this.players = this.players.filter(p => p);
        }

        console.log(`Player Logout! \n Player Info \n ID : ${player.getPlayerData().playerID} \n Name : ${player.getPlayerData().name}`);
        console.log("Current Online Player Count : " + this.players.length);
    }

    public checkIDValidate(id: string): boolean {
        return this.players.findIndex((player) => player.getPlayerData().playerID === id) === -1;
    }

}

export default Player;