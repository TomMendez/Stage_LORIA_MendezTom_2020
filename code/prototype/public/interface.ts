export const TYPE_MESINTERNE_LABEL = 'interne';
export interface message {
    type: typeof TYPE_MESINTERNE_LABEL;
    typeM: string;
    contenu : any; //A DEBUG
}

export const TYPE_MESSIMPLE_LABEL = 'simple';
export interface messageSimple {
    type: typeof TYPE_MESSIMPLE_LABEL;
    message : number
    numEnvoi : number; 
    numDest : number;
    set : string[];
    piggyback: [number,messPG][];
}

export const TYPE_MESPINGREQ_LABEL = 'pingreq';
export interface messagePingReq{
    type: typeof TYPE_MESPINGREQ_LABEL;
    message : number
    numEnvoi : number; 
    numDest : number;
    numCible : number;
    set : string[];
    piggyback: [number,messPG][];
}

export const TYPE_MESDATAUPDATE_LABEL = 'dataupdate';
export interface messageDataupdate{
    type: typeof TYPE_MESDATAUPDATE_LABEL;
    message : number;
    numEnvoi : number; 
    numDest : number;
    collaborateurs : number[];
    PG : Map<number,messPG>;
    compteurPG : Map<number,number>;
    set : string[];
    piggyback: [number,messPG][];
}

export const TYPE_MESPINGREQREP_LABEL = 'pingreqrep';
export interface messagePingReqRep{
    type: typeof TYPE_MESPINGREQREP_LABEL;
    message : number
    numEnvoi : number; 
    numDest : number;
    reponse : boolean;
    set : string[];
    piggyback: [number,messPG][];
}

export const TYPE_MESREPSERV_LABEL = 'repserv';
export interface repServ{
    type: typeof TYPE_MESREPSERV_LABEL;
    message : string;
    contenu : number,
}

export const TYPE_MESPG_LABEL = 'messpg';
export interface messPG {
    type: typeof TYPE_MESPG_LABEL;
    message: number;
    incarn: number;
}