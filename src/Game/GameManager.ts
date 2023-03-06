import {Server, Socket} from "socket.io";
import {app} from "../index";
import Player from "../Player";
import Room from "../Room";
import Util from "../Util";
import {PacketGameInfo} from "../netHandler";
import player from "../Player";

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
    index: number
    betOver: boolean
    halfEnable: boolean
}

class GameManager {
    private io: Server = null;
    private room: Room = null;
    private players: Player[] = null;
    private gameData: PacketGameInfo = null;

    private state: number = -1;

    private entryFee: number = 100;
    private currentPot: number = -1;
    private currentCall: number = -1;
    private playerData: PlayerData[] = [];
    private currPlayerIndex: number = -1;
    private allInBet: number = -1;
    private lastHalfCaller: string = null;

    private playerReadyCount: number = 0;

    constructor(room: Room, players: Player[], data: PacketGameInfo) {
        this.io = app.get("io");
        this.room = room;
        this.players = players;
        this.gameData = data;
        this.entryFee = data.entryFee;
    }

    public onGameStart(): void {
        this._initVars();
        this._startGame();
    }

    private _initVars(): void {
        this.currentPot = 0;
        this.currentCall = -1;
        this.currPlayerIndex = -1;
        this.players.forEach((p, i) => {
            this.playerData.push({
                id: p.getPlayerData().playerID,
                budget: this.gameData.budgetPerPlayer,
                halfEnable: true,
                index: i,
                betOver: false
            })
        });
        this.playerReadyCount = 0;
    }

    private _startGame(): void {
        this.broadMessage("gameStart", Util.generateResponse(false));
        this.currentCall = this.entryFee;
    }

    //todo : 나중에 플레이어 별로 Ready Property 만들어서 관리하자.
    public playerReady(): void {
        this.playerReadyCount++;
        if (this.playerReadyCount === this.players.length)
            this.changePlayerTurn();
    }

    private changePlayerTurn(): void {
        this.playerReadyCount = 0;
        this.currPlayerIndex++;
        if (this.currPlayerIndex > this.players.length - 1)
            this.currPlayerIndex = 0;

        if (this.checkTurnOver() === true) {
            this.turnOver();
            return;
        }

        this.broadMessage("changePlayerTurn", Util.generateResponse(false, {
            playerIndex: this.currPlayerIndex,
            playerID: this.players[this.currPlayerIndex].getPlayerData().playerID
        }));
        this.emitBetEnableToCurrent();
    }

    private checkTurnOver(): boolean {
        let playerOverCnt = 0;
        this.playerData.forEach((data) => {
            if (data.betOver === true)
                playerOverCnt++;
        });
        return playerOverCnt === this.players.length;
    }

    private emitBetEnableToCurrent(): void {
        const playerData = this.getPlayerData(this.players[this.currPlayerIndex].getPlayerData().playerID);
        this.players[this.currPlayerIndex].getSocket().emit("onBetEnable", Util.generateResponse(false, {
            half: playerData.halfEnable,
            call: !playerData.betOver,
            allin: !playerData.betOver
        }));
    }

    public betHalf(player: Player): void {
        if (this.getPlayerData(player.getPlayerData().playerID).halfEnable === false) {
            this.emitUnableBet(player);
            return;
        }

        let bet = this.currentPot / 2;
        if (this.currentPot < this.entryFee)
            bet = this.entryFee * 2;

        this.bet(player, bet);
        this.setDataAfterBet(player.getPlayerData().playerID, "Half", bet);
    }

    public betCall(player: Player): void {
        let bet = this.currentCall;
        this.bet(player, bet);
        this.setDataAfterBet(player.getPlayerData().playerID, "Call");
    }

    public betAllIn(player: Player): void {
        const bet = this.getPlayerData(player.getPlayerData().playerID).budget;
        this.bet(player, bet);
        this.setDataAfterBet(player.getPlayerData().playerID, "AllIn", bet);
    }

    private bet(player: Player, bet: number): void {
        if (this.getPlayerData(player.getPlayerData().playerID).budget < bet) {
            this.emitUnableBet(player);
            return;
        }

        this.getPlayerData(player.getPlayerData().playerID).budget -= bet;
        this.broadMessage("playerBet", Util.generateResponse(false, {
            playerName: player.getPlayerData().name,
            playerID: player.getPlayerData().playerID,
            betAmount: this.getChipAmount(bet),
            bet: bet,
            budget: this.getPlayerData(player.getPlayerData().playerID).budget
        }));
        this.currentPot += bet;
    }

    private setDataAfterBet(playerID: string, type: string, bet?: number): void {
        this.currentCall = bet;
        switch (type.toLowerCase()) {
            case "half":
                this.playerData.forEach((data) => {
                    data.betOver = false;
                });
                this.getPlayerData(playerID).halfEnable = true;
                this.lastHalfCaller = playerID;
                break;
            case "call":
                this.getPlayerData(playerID).betOver = true;
                this.getPlayerData(playerID).halfEnable = false;
                break;
            case "allin":
                this.allInBet = bet;
                this.playerData.forEach((data) => {
                    data.betOver = false;
                    data.halfEnable = false;
                });
                this.getPlayerData(playerID).betOver = true;
                break;
        }
    }

    private emitUnableBet(player: Player): void {
        player.getSocket().emit("unableBet", Util.generateResponse(false, {
            betEnable : false
        }));
    }

    private turnOver(): void {
        this.broadMessage("turnOver", Util.generateResponse(false));
        this.resetCurrentTurn();
    }

    private resetCurrentTurn(): void {
        this.allInBet = -1;
        this.playerData.forEach((data) => {
            data.betOver = false;
            data.halfEnable = true;
        });
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