export type Interne = Message | Log | ActuCollab | ActuSet | ActuBloques | NumUpdate | Blocage | AjoutChar | PingUI | Stop | UpdateUI;

export const TYPE_MESSAGE_LABEL = 'message';
export interface Message {
    type: typeof TYPE_MESSAGE_LABEL;
    contenu : Swim;
}

export const TYPE_LOG_LABEL = 'log';
export interface Log {
    type: typeof TYPE_LOG_LABEL;
    contenu : string;
}

export const TYPE_ACTUCOLLAB_LABEL = 'actucollab';
export interface ActuCollab {
    type: typeof TYPE_ACTUCOLLAB_LABEL;
    contenu: Map<number,string>;
}

export const TYPE_ACTUSET_LABEL = 'actuset';
export interface ActuSet {
    type: typeof TYPE_ACTUSET_LABEL;
    contenu: Set<string>;
}

export const TYPE_ACTUBLOQUES_LABEL = 'actubloques';
export interface ActuBloques {
    type: typeof TYPE_ACTUBLOQUES_LABEL;
    contenu: Set<number>;
}

export const TYPE_NUMUPDATE_LABEL = 'numupdate';
export interface NumUpdate {
    type: typeof TYPE_NUMUPDATE_LABEL;
    contenu : number;
}

export const TYPE_BLOCAGE_LABEL = 'blocage';
export interface Blocage {
    type: typeof TYPE_BLOCAGE_LABEL;
    contenu : number;
}

export const TYPE_AJOUTCHAR_LABEL = 'ajoutchar';
export interface AjoutChar {
    type: typeof TYPE_AJOUTCHAR_LABEL;
    contenu : string;
}

export const TYPE_PINGUI_LABEL = 'pingui';
export interface PingUI {
    type: typeof TYPE_PINGUI_LABEL;
    contenu : number;
}

export const TYPE_STOP_LABEL = 'stop';
export interface Stop {
    type: typeof TYPE_STOP_LABEL;
}

export const TYPE_UPDATEUI_LABEL = 'updateui';
export interface UpdateUI {
    type: typeof TYPE_UPDATEUI_LABEL;
}

// - - -
export type Swim = Ping | PingReq | Ack | DataRequest | DataUpdate | PingReqRep | RepServ;

export const TYPE_PING_LABEL = 'ping';
export interface Ping {
    type: typeof TYPE_PING_LABEL;
    numEnvoi : number; 
    numDest : number;
    set : string[];
    piggyback: [number,MessPG][];
}

export const TYPE_PINGREQ_LABEL = 'pingreq';
export interface PingReq {
    type: typeof TYPE_PINGREQ_LABEL;
    numEnvoi : number; 
    numDest : number;
    numCible : number;
    set : string[];
    piggyback: [number,MessPG][];
}

export const TYPE_ACK_LABEL = 'ack';
export interface Ack {
    type: typeof TYPE_ACK_LABEL;
    numEnvoi : number; 
    numDest : number;
    set : string[];
    piggyback: [number,MessPG][];
}

export const TYPE_DATAREQUEST_LABEL = 'datarequest';
export interface DataRequest{
    type: typeof TYPE_DATAREQUEST_LABEL;
    numEnvoi : number; 
    numDest : number;
}

export const TYPE_DATAUPDATE_LABEL = 'dataupdate';
export interface DataUpdate{
    type: typeof TYPE_DATAUPDATE_LABEL;
    numEnvoi : number; 
    numDest : number;
    collaborateurs : number[];
    PG : [number,MessPG][];
    compteurPG :[number,number][];
    set : string[];
}

export const TYPE_PINGREQREP_LABEL = 'pingreqrep';
export interface PingReqRep{
    type: typeof TYPE_PINGREQREP_LABEL;
    numEnvoi : number; 
    numDest : number;
    reponse : boolean;
    set : string[];
    piggyback: [number,MessPG][];
}

export const TYPE_REPSERV_LABEL = 'repserv';
export interface RepServ{
    type: typeof TYPE_REPSERV_LABEL;
    contenu : number,
}

// - - -

export const TYPE_MESSPG_LABEL = 'MessPG';
export interface MessPG {
    type: typeof TYPE_MESSPG_LABEL;
    message: NumPG;
    incarn: number;
}

enum NumPG {
    Joined = 1,
    Alive = 2,
    Suspect = 3,
    Confirm = 4,
}