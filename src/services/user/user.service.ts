export abstract class UserService {
    abstract register(registrationData: RegistrationData): Promise<void>;
    abstract requestPair(requestData: RequestPairData): Promise<void>
    abstract respondPair(responseData: PairResponseData): Promise<void>;
}

// TODO make interfaces better
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

export interface PairRequestData {
    requestingUsername: string;
    respondingUsername: string;
    pairingCode: string;
}
