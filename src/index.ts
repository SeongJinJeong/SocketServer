import * as express from "express";
import {createServer} from "http";
import {Server} from "socket.io";
import * as cors from "cors";

import NetHandler from "./netHandler";

export const app: express.Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

export let netHandler: NetHandler = null;

io.on("connection", (socket) => {
    netHandler = new NetHandler(io, socket);
});

app.use(cors());

app.get('/', (req, res) => {
    res.send("<h1>Socket Server</h1>")
})

httpServer.listen(3231, function () {
    console.log("Server Started at 3231");
});