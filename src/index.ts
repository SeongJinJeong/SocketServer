import * as express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import * as cors from "cors";

import NetHandler from "./netHandler";

export const app : express.Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

let netHandler : NetHandler = null;

io.on("connection", (socket) => {
    // ...
    console.log("Connected Player!");
    netHandler = new NetHandler(io,socket);
    socket.on("disconnect",function(resason){
        socket.disconnect();
    })
});

app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(__dirname+"");
})

httpServer.listen(3231,function(){
    console.log("Server Started at 3231");
});