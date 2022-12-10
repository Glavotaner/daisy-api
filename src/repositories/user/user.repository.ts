import { RegistrationData } from "../../services/user/user.service";

export abstract class UserRepository {
    abstract get({ username }: { username: string }): Promise<User | undefined>;
    // TODO don't use callbacks
    async tryGetUser(username: string, { onFound, onNotFound }: { onFound: userFoundCallback, onNotFound: userNotFoundCallback }): Promise<any> {
        const user = await this.get({ username });
        return user ? onFound(user) : onNotFound();
    }
    abstract create({ username, token }: RegistrationData): Promise<any>;
    abstract update(username: string, properties: Record<string, any>): Promise<any>;
}

type userFoundCallback = (user: User) => Promise<any>;
type userNotFoundCallback = () => Promise<any>;

export interface User {
    username: string;
    token: string;
    pair?: string;
    pairingCode?: string;
}
