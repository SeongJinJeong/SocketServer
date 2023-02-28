import {app} from "./index";
import {PacketCreateRoom} from "./netHandler";
import {Server, Socket} from "socket.io";

class Room implements PacketCreateRoom{
    io : Server = null;
    socket : Socket = null;

    public roomid : string = null;
    public roomName : string = null;
    constructor(roomid? : string, roomName? : string) {
        this.io = app.get("io");
        this.socket = app.get("socket");

        this._init(roomid,roomName);
    }
    private _init(roomid, roomName) : void {
        this.roomid = roomid;
        this.roomName = roomName;
    }

    public getRoomID() : string {
        return this.roomid;
    }
}

export default Room;