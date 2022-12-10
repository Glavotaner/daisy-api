import { RegistrationData } from "../../services/user/user.service";

export abstract class UserRepository {
    abstract get({ username }: { username: string }): Promise<User | undefined>;
    abstract create({ username, token }: RegistrationData): Promise<any>;
    abstract update(username: string, properties: Record<string, any>): Promise<any>;
}

export interface User {
    username: string;
    token: string;
    pair?: string;
    pairingCode?: string;
}
