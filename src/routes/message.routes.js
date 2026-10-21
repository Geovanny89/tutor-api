'use strict';

const { Router } = require('express');
const MessageController = require('../controllers/message.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/contacts', MessageController.getContacts);
router.get('/unread/count', MessageController.getUnreadCount);
router.get('/:userId', MessageController.getThread);
router.post('/', MessageController.sendMessage);

module.exports = router;
