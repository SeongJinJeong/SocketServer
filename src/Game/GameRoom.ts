import Room from "../Room";
import GameManager from "./GameManager";
import Player from "../Player";
import {PacketGameInfo} from "../netHandler";

class GameRoom extends Room {
    private manager: GameManager = null;

    public initGameRoom(players: Player[], data : PacketGameInfo): void {
        this.players = players;
        this.manager = new GameManager(this, this.players, data);
    }
    public startGame() : void {
        this.manager.onGameStart();
    }
    public getManager() : GameManager {
        return this.manager;
    }
}

export default GameRoom;