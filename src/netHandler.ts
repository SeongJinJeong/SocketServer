import {Socket, Server} from "socket.io";
import {app} from "./index";
import Room from "./Room";
import room from "./Room";

interface PacketEntry {
    playerID: number
    currentRoom: string
    playerName: string
}

export interface PacketCreateRoom {
    roomid: string,
    roomName: string,
}

class NetHandler {
    io: Server = null;
    socket: Socket = null;
    rooms: Room[] = null;

    constructor(io: Server, socket: Socket) {
        this.io = io;
        this.socket = socket;
        app.set('io', this.io);
        app.set('socket', this.socket);

        this._initHandler();
        this._initData();
    }

    private _initHandler(): void {
        this.addListener("disconnect", this.onDisconnect.bind(this));

        this.addListener("joinRoom", this.onJoinRoom.bind(this));
        this.addListener("leaveRoom", this.onLeaveRoom.bind(this));

        this.addListener("test", this.onTest.bind(this));
        this.addListener("testBroadCast", this.onTestBroadCast.bind(this));
    }

    private _initData(): void {
        this.rooms = [];
    }

    private onDisconnect(reason: string): void {
        console.log("Disconnected Default : " + JSON.stringify(reason));
        this.socket.disconnect();
    }

    private async onJoinRoom(data: { roomid: string }): Promise<void> {
        const room = new Room(data.roomid);
        this.rooms.push(room);
        await this.socket.join(data.roomid);
        const roomMembers = await this.io.in(room.getRoomID()).fetchSockets();
        console.log("Room Joined " + data.roomid);
        console.log("Room Length : " + roomMembers.length);
    }

    private async onLeaveRoom(data: { roomid: string }): Promise<void> {
        this.socket.leave(data.roomid);
        const members = await this.io.in(data.roomid).fetchSockets();
        console.log("Room Leaved : " + data.roomid);
        console.log("Room Length : " + members.length);
    }

    private onTest(msg: any) {
        console.log(`Test Msg : ${msg.msg}`);
    }

    private onTestBroadCast(data: { roomid: string, msg: string }) {
        console.log(`Test BroadCast Msg : ${data.msg}`);
        this.socket.to(data.roomid).emit("test", {
            msg: data.msg
        })
    }

    public addListener(event: string, cb: (...args: any[]) => void): void {
        this.socket.on(event, cb);
    }
}

export default NetHandler;