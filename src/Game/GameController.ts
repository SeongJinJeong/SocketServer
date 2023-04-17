import GameManager from "./GameManager";
import Util from "../Util";
import player, {default as User} from "../Player";

export enum BetType {
    None,
    All_In,
    Half,
    Call,
    Check,
    Fold
}

interface Player {
    currentBudget: number,
    enableBetInfo: {
        all_in: boolean,
        half: boolean,
        call: boolean,
        check: boolean,
        fold: boolean
    },
    isFold: boolean,
    betOver : boolean
}

class GameController {
    private gameManager: GameManager = null;
    private playerBetInfo: Player[] = null;
    private roundCount : number = 0;
    
    private currentPlayer: User = null;
    private currentPot: number = 0;
    private currentBetType: BetType = BetType.None;
    private currentBet: number = 0;
    private currentPlayerIndex: number = 0;
    private lastHalfCaller: number = 0;

    private readyCount: number = -1;

    constructor(owner: GameManager, playerCount: number, gameStartData : {budget : number}[]) {
        this.gameManager = owner;
        this._initVars(playerCount);
        this._init(gameStartData);
    }

    private _initVars(playerCount: number): void {
        for (let i = 0; i < playerCount; i++) {
            this.playerBetInfo[i] = {
                currentBudget: 0,
                enableBetInfo: {
                    all_in: true,
                    half: true,
                    call: true,
                    check: true,
                    fold: true
                },
                isFold: false,
                betOver : false
            }
        }
    }

    private _init(gameStartData : {budget : number}[]): void {
        for(let i=0; i<this.playerBetInfo.length; i++){
            this.playerBetInfo[i].currentBudget = gameStartData[i].budget;
        }
    }

    public startGame(): void {
        this.processAnte();
    }

    private processAnte(): void {
        for (let i = 0; i < this.playerBetInfo.length; i++) {
            let ante: number = this.gameManager.getGameData().entryFee;
            this.currentPot += ante;
            this.playerBetInfo[i].currentBudget -= ante;
        }

        this.gameManager.broadMessage('ante', Util.generateResponse(false, {
            playerBudget: this.playerBetInfo.map((info) => {
                return info.currentBudget;
            })
        }));

        this.currentBet = this.gameManager.getGameData().entryFee;
    }

    public onPlayerReady(): void {
        this.readyCount++;
        if (this.readyCount >= this.playerBetInfo.length)
            this.processNextPlayer();
    }

    private processNextPlayer(): void {
        this.readyCount = 0;

        this.currentPlayerIndex++;
        if (this.currentPlayerIndex > this.playerBetInfo.length - 1)
            this.currentPlayerIndex = 0;

        if(this.checkTurnOver() === true){
            this.emitBetOver();
            this.resetPlayerBetInfo();
            this.roundCount++;
            if(this.roundCount >= 4)
                this.gameOver();
            return;
        } 

        if (this.checkPlayerBetEnable(this.currentPlayerIndex) === false) {
            this.gameManager.broadMessage("changeTurn", Util.generateResponse(false, {
                nextPlayerID: this.gameManager.getPlayerDataByIndex(this.currentPlayerIndex).id
            }));

            let playerID = this.gameManager.getPlayerDataByIndex(this.currentPlayerIndex).id;
            this.gameManager.getRoom().getRoomPlayer(playerID).getSocket().emit("onBetEnable", Util.generateResponse(false, {
                allin : this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.all_in,
                half: this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.half,
                call: this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.call,
                check: this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.check,
                fold: this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.fold,
            }));
        } else {
            this.processNextPlayer();
        }
    }
    
    private checkTurnOver() : boolean {
        let isOver = false;
        for(let i=0; i<this.playerBetInfo.length; i++){
            if(this.playerBetInfo[i].betOver === true){
                isOver = true;
                break;
            }
        }
        
        return isOver;
    }

    private checkPlayerBetEnable(index): boolean {
        return this.playerBetInfo[index].isFold;
    }

    private emitBetOver(): void {
        this.gameManager.broadMessage("betOver", Util.generateResponse(false));
    }

    //region [ Betting Process ]
    public onPlayerBet(betType: BetType, player: User): void {
        this.currentPlayer = player;
        switch (betType) {
            case BetType.All_In:
                this.processAllIn();
                break;
            case BetType.Half:
                this.processBetHalf();
                break;
            case BetType.Call:
                this.processBetCall();
                break;
            case BetType.Check:
                this.processBetCheck();
                break;
            case BetType.Fold:
                this.processBetFold();
                break;
            default:
                console.error("Invalid Betting Type");
                break;
        }
    }

    private processAllIn() : void {
        this.updateBalance(this.currentPlayerIndex,this.playerBetInfo[this.currentPlayerIndex].currentBudget);
        this.currentBetType = BetType.All_In;
        this.lastHalfCaller = this.currentPlayerIndex;
        this.setAllPlayerCheckEnable(false);
        this.setAllPlayerHalfEnable(false);
    }
    private processBetHalf(): void {
        // 하프값이 앤티의 두배보다 낮으면 앤티의 두배를 적용함
        const ante = this.gameManager.getGameData().entryFee;
        let betPrice: number = this.currentPot / 2 > ante * 2 ? this.currentPot / 2 : ante * 2;

        if (this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.half === false) {
            this.emitBetUnable();
            return;
        }

        if (this.updateBalance(this.currentPlayerIndex, betPrice) === true) {
            this.lastHalfCaller = this.currentPlayerIndex;
            this.currentBetType = BetType.Half;
            this.setAllPlayerHalfEnable(true);
            this.setAllPlayerCheckEnable(false);
            this.emitBetSucceed();
        } else {
            this.emitBetUnable();
        }
    }

    private processBetCall(): void {
        if (this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.call === false) {
            this.emitBetUnable();
            return;
        }

        if (this.updateBalance(this.currentPlayerIndex, this.currentBet) === true) {
            this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.half = false;
            this.playerBetInfo[this.currentPlayerIndex].betOver = true;
            this.currentBetType = BetType.Call;
            this.setAllPlayerCheckEnable(false);
            this.emitBetSucceed();
        } else {
            this.emitBetUnable();
        }
    }

    private processBetCheck(): void {
        if (this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.check === false) {
            this.emitBetUnable();
            return;
        }

        if (this.updateBalance(this.currentPlayerIndex, 0) === true) {
            this.playerBetInfo[this.currentPlayerIndex].enableBetInfo.half = false;
            this.playerBetInfo[this.currentPlayerIndex].betOver = true;
            this.currentBetType = BetType.Check;
            this.emitBetSucceed();
        } else {
            this.emitBetUnable();
        }
    }

    private processBetFold(): void {
        if (this.updateBalance(this.currentPlayerIndex, 0) === true) {
            this.playerBetInfo[this.currentPlayerIndex].isFold = true;
            this.playerBetInfo[this.currentPlayerIndex].betOver = true;
            this.emitBetSucceed();
        }
    }

    private setAllPlayerHalfEnable(bool: boolean): void {
        for (let i = 0; i < this.playerBetInfo.length; i++) {
            this.playerBetInfo[i].enableBetInfo.half = bool;
            this.playerBetInfo[i].betOver = bool;
        }
    }

    private setAllPlayerCheckEnable(bool: boolean): void {
        for (let i = 0; i < this.playerBetInfo.length; i++) {
            this.playerBetInfo[i].enableBetInfo.check = bool;
        }
    }

    private updateBalance(index: number, betPrice: number): boolean {
        if (this.playerBetInfo[index].currentBudget < betPrice) {
            return false;
        }

        this.playerBetInfo[index].currentBudget -= betPrice;
        this.currentBet = betPrice;
        this.currentPot += betPrice;
        return true;
    }

    private emitBetUnable(): void {
        this.currentPlayer.getSocket().emit("unableBet", Util.generateResponse(true));
    }

    private emitBetSucceed(): void {
        this.gameManager.broadMessage("onBetSucceed", Util.generateResponse(false, {
            playerID: this.currentPlayer.getPlayerData().playerID,
            betPrice: this.currentBet,
            betType: this.currentBetType
        }));
    }

    //endregion

    private resetPlayerBetInfo(): void {
        for (let i = 0; i < this.playerBetInfo.length; i++) {
            if (this.playerBetInfo[i].isFold === false) {
                this.playerBetInfo[i].enableBetInfo = {
                    all_in:true,
                    half: true,
                    call: true,
                    check: true,
                    fold: true
                }
                this.playerBetInfo[i].betOver = false;
            }
        }
    }
    
    private gameOver() : void {
        var data = this.playerBetInfo.map((info,index)=>{
            return {
                playerIndex : index,
                budget : info.currentBudget
            }
        });
        this.gameManager.gameOver(data);
    }
}

export default GameController;