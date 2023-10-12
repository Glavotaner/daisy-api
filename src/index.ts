import { App } from './app.js';
import { MessagingServiceFcm } from './services/messaging/messaging.service.fcm.js';
import { UserServiceFirestore } from './services/user/users.service.firestore.js';
import { UserRepositoryFirestore } from './repositories/user/user.repository.firestore.js';
import * as functions from 'firebase-functions';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app'; 'firebase-admin/app';
import { serviceAccount } from './assets/service_account.js';

initializeApp({
    credential: cert(serviceAccount as ServiceAccount)
});
const userRepository = new UserRepositoryFirestore();
const messagingService = new MessagingServiceFcm(userRepository);
const userService = new UserServiceFirestore(userRepository, messagingService);
const {app} = new App(userService, messagingService);

exports.api = functions.region('europe-west3').https.onRequest(app);