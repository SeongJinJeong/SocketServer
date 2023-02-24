class Entry {
    private static instance: Entry;
    static getInstance(io? : any, socket? : any): Entry {
        if (!!this.instance) {
            return this.instance;
        }

        this.instance = new Entry(io,socket);
        return this.instance;
    }

    private io : any = null;
    private socket : any = null;
    private rooms: Array<string> = [];
    constructor(io : any, socket : any) {
        this.init();
        this.io = io;
        this.socket = socket;
    }

    private init(): void {
        this.rooms = [];
    }

    public createRoom(roomid): string {
        this.rooms.push(roomid);
        console.log(this.rooms.length);
        return roomid;
    }

    public findRoom(roomid): string | null {
        let index = this.rooms.indexOf(roomid);
        if(index < 0)
            return null;

        return this.rooms[index];
    }

    public joinRoom(socket, roomid : string) : void {
        if(this.rooms.indexOf(roomid) !== -1){
            socket.join(roomid);
        }
        else
            console.warn("Room is not exist");
    }
}
export default Entry;