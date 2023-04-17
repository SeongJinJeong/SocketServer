export interface PlayerData {
    name : string
    id : string
}

export interface RoomData {
    roomid : string
    playerData : PlayerData[]
}

//region [ Packet ]
//region [ Listener ]
export interface PacketOnLogin {
    name : string
}
export interface PacketOnEnterLobby {

}

export interface PacketOnGetLobbyRooms {

}

export interface PacketOnEnterRoom {
    roomid : string
}

export interface PacketOnLeaveRoom {
    roomid : string
}

export interface PacketOnGameStart {
    roomid : string
    budgetPerPlayer : number
    playerCount : number
    timer : number
    entryFee : number
}

export interface PacketOnPlayerReady {
    roomid : string
    id : string
}

export interface PacketOnPlayerBet {
    roomid : string
    id : string
    betType : string
}
//endregion
//region [ Emitter ]
export interface PacketEmitLoginSucceed {
    name : string
    id : string
}

export interface PacketEmitEnterLobbySucceed {
    roomid : string
    playerCount : number
}

export interface PacketEmitRoomData {

}
//endregion
//endregion