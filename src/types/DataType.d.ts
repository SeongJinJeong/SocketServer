interface PlayerData {
    name : string
    playerID : string
}

interface RoomData {
    roomid : string
    playerData : PlayerData[]
}

//region [ Packet ]
//region [ Listener ]
interface PacketOnLogin {
    name : string
}
interface PacketOnEnterLobby {

}

interface PacketOnGetLobbyRooms {

}

interface PacketOnEnterRoom {
    roomid : string
}

interface PacketOnGetRoomData {
    
}

interface PacketOnGetPlayerData {
    
}

interface PacketOnChatRoom {
    roomid : string,
    msg : string
}

interface PacketOnLeaveRoom {
    
}

interface PacketGameInfo {
    roomid: string
    budgetPerPlayer: number
    playerCount: number
    timer: number
    entryFee : number
}

interface PacketOnPlayerReady {
    id : string
}

interface PacketOnPlayerBet {
    id : string
    betType : string
}
//endregion
//region [ Emitter ]
interface PacketEmitLoginSucceed {
    name : string
    id : string
}

interface PacketEmitEnterLobbySucceed {
    roomid : string
    playerCount : number
}

interface PacketEmitRoomData {
    roomid : string
    playerData : {
        id: string
        name : string
    }[]
}
//endregion
//endregion