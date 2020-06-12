export interface message {
    type: string;
    contenu : any;
}

export interface messageSimple {
    message : number
    numEnvoi : number; 
    numDest : number;
    set : string[];
    piggyback: [number,messPG][];
}

export interface messagePingReq{
    message : number
    numEnvoi : number; 
    numDest : number;
    numCible : number;
    set : string[];
    piggyback: [number,messPG][];
}

export interface messageDataupdate{
    message : number;
    numEnvoi : number; 
    numDest : number;
    collaborateurs : number[];
    PG : Map<number,messPG>;
    compteurPG : Map<number,number>;
    set : string[];
    piggyback: [number,messPG][];
}

export interface messagePingReqRep{
    message : number
    numEnvoi : number; 
    numDest : number;
    reponse : boolean;
    set : string[];
    piggyback: [number,messPG][];
}

export interface repServ{
    message : string;
    contenu : number,
}

export interface messageSimple {
    type: string;
    contenu : any;
}


export interface messPG {
    message: number;
    incarn: number;
}

export function instanceOfRepServ(object: any): object is repServ {
    return 'message' in object && 'contenu' in object;
}

export function instanceOfmessagePingReq(object: any): object is messagePingReq {
    return 'message' in object && 'numCible' in object;
}

export function instanceOfmessagePingReqRep(object: any): object is messagePingReqRep {
    return 'message' in object && 'reponse' in object;
}

export function instanceOfmessageDataUpdate(object: any): object is messageDataupdate {
    return 'message' in object && 'collaborateurs' in object;
}