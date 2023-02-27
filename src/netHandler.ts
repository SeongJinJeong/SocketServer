import {Socket, Server} from "socket.io";
import {app} from "./index";
import Lobby from "./Lobby";

interface PacketEntry {
    playerID : number
    currentRoom : string
    playerName : string
}

interface PacketCreateRoom {
    roomid : string,
    roomName : string,
}

class NetHandler {
    io: Server = null;
    socket: Socket = null;
    lobbyHandler : Lobby = null;

    constructor(io: Server, socket: Socket) {
        this.io = io;
        this.socket = socket;
        app.set('io',this.io);
        app.set('socket',this.socket);

        this._initLobby();
    }

    private _initLobby() : void {
        this.lobbyHandler = new Lobby();
    }
}

export default NetHandler;