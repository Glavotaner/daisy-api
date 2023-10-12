import { App } from './app.js';
import { MessagingServiceFcm } from './services/messaging/messaging.service.fcm.js';
import { UserServiceFirestore } from './services/user/users.service.firestore.js';
import { UserRepositoryFirestore } from './repositories/user/user.repository.firestore.js';
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'; 'firebase-admin/app';
import { serviceAccount } from './assets/service_account.js';

initializeApp({
    credential: cert(serviceAccount as ServiceAccount)
});
const userRepository = new UserRepositoryFirestore();
const messagingService = new MessagingServiceFcm(userRepository);
const userService = new UserServiceFirestore(userRepository, messagingService);
const {app} = new App(userService, messagingService);

exports.api = onRequest(app);