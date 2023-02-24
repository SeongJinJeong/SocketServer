import * as express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import SocketServer from "./socket";
import * as cors from "cors";
import Entry from "./entry";

/** @type {Express} */
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    // ...
    console.log("Connected Player!");
    const server = new SocketServer(socket);
    Entry.getInstance(io, socket);
});

app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(__dirname+"");
})

httpServer.listen(3231,function(){
    console.log("Server Started at 3231");
});