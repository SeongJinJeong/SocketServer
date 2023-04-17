import Room from "../Room";
import GameManager from "./GameManager";
import Player from "../Player";

class GameRoom extends Room {
    private manager: GameManager = null;

    public async initGameRoom(players: Player[], data: PacketGameInfo): Promise<void> {
        this.players = players;
        for (const player of this.players) {
            await player.joinRoom(this.getRoomID());
        }
        this.manager = new GameManager(this, this.players, data);
    }

    public getManager(): GameManager {
        return this.manager;
    }
}

export default GameRoom;