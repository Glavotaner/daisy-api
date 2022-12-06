import { CollectionReference, Firestore } from "@google-cloud/firestore";
import { User, UserRepository } from "./user.repository.js";
import { serviceAccount } from '../../assets/service_account.js';

export class UserRepositoryFirestore extends UserRepository implements UserRepository {

    private users: CollectionReference;

    constructor() {
        super();
        const firestore = new Firestore({
            serviceAccount,
            projectId: serviceAccount.project_id,
        });
        this.users = firestore.collection('users');
    }

    async get({ username }: { username: string }): Promise<User | undefined> {
        const query = await this.users.where('username', '==', username).get();
        const [userDoc] = query.docs;
        if (userDoc) {
            const { username, token, pairingCode } = userDoc.data();
            return { username, token, pairingCode };
        } else {
            return undefined;
        }
    }

    update(username: string, properties: Record<string, any>) {
        return this.users.doc(username).update(properties);
    }

    create({ username, token }: User) {
        return this.users.doc(username).set({ username, token });
    }

}