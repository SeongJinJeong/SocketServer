import {Server, Socket} from "socket.io";
import {app} from "../index";
import Player from "../Player";
import Room from "../Room";
import Util from "../Util";
import {PacketGameInfo} from "../netHandler";

const STATE = {
    NONE: 0,
    IDLE: 1,
    READY: 2,
    BET: 3,
    BET_FINISH: 4,
    TURN_OVER: 5
}

interface PlayerData {
    id: string
    budget: number
    callHalf: boolean
    canHalf: boolean
    index: number
    betOver: boolean
}

class GameManager {
    private io: Server = null;
    private room: Room = null;
    private players: Player[] = null;
    private gameData: PacketGameInfo = null;

    private state: number = -1;

    private currentPot: number = -1;
    private currentCall: number = -1;
    private playerData: PlayerData[] = [];
    private currPlayerIndex: number = -1;
    private isAllIn: boolean = false;
    private lastHalfer: string = null;

    private playerReadyCount: number = 0;

    constructor(room: Room, players: Player[], data: PacketGameInfo) {
        this.io = app.get("io");
        this.room = room;
        this.players = players;
        this.gameData = data;
    }

    public onGameStart(): void {
        this._initVars();
        this._startGame();
    }

    private _initVars(): void {
        this.currentPot = 0;
        this.currentCall = 0;
        this.currPlayerIndex = 0;
        this.players.forEach((p, i) => {
            this.playerData.push({
                id: p.getPlayerData().playerID,
                budget: this.gameData.budgetPerPlayer,
                callHalf: false,
                canHalf: true,
                index: i,
                betOver: false
            })
        });
        this.playerReadyCount = 0;
    }

    private _startGame(): void {
        this.broadMessage("gameStart", Util.generateResponse(false));
    }

    public playerReady(): void {
        this.playerReadyCount++;
        if (this.playerReadyCount >= 4)
            this.changePlayerTurn();
    }

    private changePlayerTurn(): void {
        if (this.currPlayerIndex > this.players.length)
            this.currPlayerIndex = 0;

        // 마지막 하프 뱃에서 멈추기.
        if (this.playerData[this.currPlayerIndex].id === this.lastHalfer || this.playerData[this.currPlayerIndex].betOver) {
            this.turnOver();
            return;
        }

        this.broadMessage("changePlayerTurn", Util.generateResponse(false, {
            playerIndex: this.currPlayerIndex,
            playerName: this.players[this.currPlayerIndex].getPlayerData().name
        }));
        this.emitCurrPlayer();

        this.currPlayerIndex++;
    }

    private emitCurrPlayer() : void {
        const playerData = this.getPlayerData(this.players[this.currPlayerIndex].getPlayerData().playerID);
        this.players[this.currPlayerIndex].getSocket().emit("onBetEnable",Util.generateResponse(false, {
            half : playerData.canHalf,
            call : playerData.betOver,
            allin : playerData.betOver
        }));
    }

    public betHalf(player: Player): void {
        const bet = this.currentPot / 2;
        this.bet(player, bet);

        this.lastHalfer = player.getPlayerData().playerID;
        this.playerData.forEach((data) => {
            data.betOver = false;
        });
    }

    public betCall(player: Player): void {
        const bet = this.currentCall;
        this.bet(player, bet);
        this.getPlayerData(player.getPlayerData().playerID).betOver = true;
        this.getPlayerData(player.getPlayerData().playerID).canHalf = false;
    }

    public betAllIn(player: Player): void {
        const bet = this.getPlayerData(player.getPlayerData().playerID).budget;
        this.bet(player, bet);
        this.isAllIn = true;
        this.getPlayerData(player.getPlayerData().playerID).betOver = true;
        this.getPlayerData(player.getPlayerData().playerID).canHalf = false;
    }

    private bet(player: Player, bet: number): void {
        if (this.getPlayerData(player.getPlayerData().playerID).budget < bet) {
            player.getSocket().emit("unableBet", Util.generateResponse(true));
            return;
        }

        this.getPlayerData(player.getPlayerData().playerID).budget -= bet;
        this.broadMessage("playerBet", Util.generateResponse(false, {
            playerName: player.getPlayerData().name,
            playerID: player.getPlayerData().playerID,
            betAmount: this.getChipAmount(bet)
        }));
    }

    private turnOver(): void {
        this.broadMessage("turnOver", Util.generateResponse(false));
        this.playerData.forEach((data) => {
            data.betOver = false;
        });
        this.playerReadyCount = 0;
        this.isAllIn = false;
    }

    private broadMessage(event: string, msg: any): void {
        this.io.in(this.room.getRoomID()).emit(event, msg);
    }

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
}

export default GameManager;