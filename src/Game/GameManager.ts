import {Server, Socket} from "socket.io";
import {app} from "../index";
import Player from "../Player";
import Room from "../Room";
import Util from "../Util";
import player from "../Player";
import GameController, {BetType} from "./GameController";

interface PlayerData {
    id: string
    budget: number
    index: number
}

class GameManager {
    private room: Room = null;
    private gameData: PacketGameInfo = null;
    private players: Player[] = null;
    private gameController : GameController = null;
    private playerData : PlayerData[] = null;
    
    constructor(room: Room, players: Player[], data: PacketGameInfo) {
        this.room = room;
        this.players = players;
        this.gameData = data;
    }

    public onGameStart(): void {
        this._initVars();
        this._startGame();
    }

    private _initVars(): void {
        this.playerData = [];
        this.players.forEach((p, i) => {
            this.playerData.push({
                id: p.getPlayerData().playerID,
                budget: this.gameData.budgetPerPlayer,
                index: i
            });
        });
        this.playerData.sort((prev,curr)=>{
            return prev.index - curr.index;
        });
    }

    private _startGame(): void {
        this.gameController = new GameController(this, this.players.length);
        this.broadMessage("gameStart", Util.generateResponse(false));
    }
    
    public playerReady(): void {
        this.gameController.onPlayerReady();
    }
    
    public playerBet(betType:BetType, player : Player) : void {
        this.gameController.onPlayerBet(betType, player);
    }

    public gameOver(data : {playerIndex : number, budget : number}[]) : void {
        for(let i=0; i<data.length; i++){
            this.playerData[data[i].playerIndex].budget = data[i].budget;
        }

        this.broadMessage("gameOver",Util.generateResponse(false,{
            playerData: this.playerData.map((data)=>{
                return {
                    id : data.id,
                    budget : data.budget
                }
            })
        }))
    }

    public broadMessage(event: string, msg: any): void {
        const server : Server = app.get("io");
        server.in(this.room.getRoomID()).emit(event, msg);
    }
    
    //region [ Getter ]
    private getPlayerData(id: string): PlayerData {
        return this.playerData.find(data => data.id === id);
    }

    private getChipAmount(bet: number): string {
        const base = this.gameData.budgetPerPlayer / 4;
        if (bet >= base * 4)
            return "Grand";
        else if (bet >= base * 3)
            return "Mega";
        else if (bet >= base * 2)
            return "Super";
        else if (bet >= base)
            return "Big";
        else
            return "Normal";
    }
    
    public getGameData() : PacketGameInfo {
        return this.gameData;
    }
    
    public getPlayerDataByIndex(index) : PlayerData {
        return this.playerData[index];
    }
    public getRoom() : Room {
        return this.room;
    }
    //endregion
}

export default GameManager;