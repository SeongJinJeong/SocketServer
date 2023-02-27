import {app} from "./index";
import {Namespace, Server, Socket} from "socket.io";

interface PacketLobbyEntry {
    code: number
}

interface PacketRoomInfo {
    userID: string | number
    roomName: string
    roomID: string
}

interface LobbyRoomInfo {
    playerCount: number
    roomName: string
    owner: string
    roomID: string
}

class Lobby {
    lobbyIo: Namespace = null;
    socket: Socket = null;
    roomIndex: number = null;
    private room: PacketRoomInfo[] = null;

    constructor() {
        const io : Server = app.get('io');
        const self = this;
        this.lobbyIo = io.of("/Lobby");
        this.lobbyIo.on("connection", function (socket) {
            console.log("Lobby Connected!");
            self.onConnect(socket);
            self.socket = socket;
            self.initHandler.call(self);
        });
    }

    private initHandler(): void {
        const self = this;

        this.socket.on("disconnect", function (socket) {
            self.onDisconncet(null);
        });


        this.socket.on("createRoom", function (roomData: PacketRoomInfo) {
            self.onCreateRoom(roomData);
        });
        this.socket.on("enterRoom", function (roomid) {
            self.onEnterRoom(roomid);
        });
    }

    private getEntryData(): PacketLobbyEntry {
        return {
            code: 200
        }
    }

    //region [ Sender ]
    //endregion

    //region [ Receiver ]
    private onConnect(socket: Socket): void {
        socket.emit("lobbyEntry", this.getEntryData());
    }

    private onDisconncet(socket: Socket): void {
        console.log("Lobby Disconnect");
        this.socket.disconnect(true);
    }

    private onEnterRoom(roomid : string): void {
        if(this.room.find(data => data.roomID === roomid) !== undefined)
            this.socket.join(roomid);
        else
            this.socket.emit("noRoom",{
                code : 200,
                message : "No Exist Room"
            })
    }

    private onCreateRoom(msg: PacketRoomInfo): void {
        if(Array.isArray(this.room))
            this.room.push(this.createRoomData(msg));
        else
            this.room = [this.createRoomData(msg)];

        this.socket.join(this.getNewRoomIndex());
        console.log(JSON.stringify(msg));
    }

    //endregion

    private getNewRoomIndex(): string {
        const index = this.roomIndex++;
        return index.toString();
    }

    private createRoomData(msg: PacketRoomInfo): PacketRoomInfo {
        return {
            roomID: this.getNewRoomIndex(),
            roomName: msg.roomName,
            userID: msg.userID
        }
    }
}

export default Lobby;