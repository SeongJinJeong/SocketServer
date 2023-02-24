import {EntryData} from "../@types/Entry";
import Player from "./player";
import Entry from "./entry";

class SocketServer {
    socket : any = null;
    player : Player = null;

    testCount = 0;
    constructor(socket : any) {
        this.socket = socket;
        this.init();
    }

    init() : void {
        this.initEntryPoint();
        this.initMessage();
        this.initTestPoint();
    }
    _createPlayer(data : EntryData) : void {
        this.player = new Player(data);
    }
    initEntryPoint() : void {
        this.socket.on("entry",function(data : EntryData){
            this._createPlayer(data);
            this.socket.emit("entry",this.player.getAllData());
        }.bind(this));

        const self = this;
        setInterval(()=>{
            self.testCount++;
            self.socket.emit("test",{
                msg : self.testCount
            })
        }, 5000);
    }
    initMessage () : void {
        this.socket.on("createRoom",function(msg){
            Entry.getInstance().createRoom(msg.roomid);
        });

        this.socket.on("joinRoom",function(msg){
            Entry.getInstance().joinRoom(this.socket,msg.roomid);
        }.bind(this))
    }
    initTestPoint() : void {
        this.socket.on("test",function(data){
            console.log(JSON.stringify(data));
        });
    }
}

export default SocketServer;