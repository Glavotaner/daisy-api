export abstract class UserService {
    abstract register(registrationData: RegistrationData): Promise<void>;
    abstract requestPair(requestData: RequestPairData): Promise<void>
    abstract respondPair(responseData: PairResponseData): Promise<void>;
}

export interface RegistrationData {
    username: string;
    token: string;
}

export interface RequestPairData {
    requestingUsername: string;
    pairUsername: string;
}

export interface PairResponseData extends PairingMessagingData {
    pairingResponse: string;
}

export interface PairRequestData extends PairingMessagingData {
    pairingCode: string;
}

export interface PairingMessagingData {
    requestingUsername: string;
    respondingUsername: string;
}
