export abstract class UserService {
    abstract register({ username, token }: RegistrationData): Promise<void>;
    abstract requestPair({ requestingUsername, pairUsername }: RequestPairData): Promise<void>
    abstract respondPair({ requestingUsername, respondingUsername, pairingResponse }: PairResponseData): Promise<void>;
}

export interface RegistrationData {
    username: string;
    token: string;
}

export interface RequestPairData {
    requestingUsername: string;
    pairUsername: string;
}

export interface PairResponseData {
    requestingUsername: string;
    respondingUsername: string;
    pairingResponse: string;
}
