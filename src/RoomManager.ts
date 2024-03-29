import Room from "./Room";
import {Server} from "socket.io";
import GameRoom from "./Game/GameRoom";

class RoomManager {
    rooms: Room[] = null;

    constructor() {
        this.rooms = [];
    }

    public createRoom(roomid: string): Room {
        let room = this.rooms.find((roomData) => {
            return roomData.getRoomID() === roomid;
        });
        if (!!room)
            return room;

        room = new Room(roomid);
        this.rooms.push(room);

        return room;
    }

    public async leaveRoom(roomid : string,io: Server): Promise<void> {
        const room = this.rooms.find((room) => room.getRoomID() === roomid);
        if (room === undefined)
            return;

        const members = await io.in(room.getRoomID()).fetchSockets();
        if (members.length === 0) {
            this.rooms[this.rooms.indexOf(room)] = null;
            this.rooms = this.rooms.filter(room => room);
        }
    }

    public getRoom(roomid: string): Room | GameRoom {
        const room = this.rooms.find(room => room.getRoomID() === roomid);
        return room || null;
    }

    public getAllRoom(): Room[] {
        return this.rooms;
    }
}

export default RoomManager;