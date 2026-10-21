'use strict';

const { Op } = require('sequelize');
const { User, Message } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { ROLES, STAFF_ROLES, HTTP_STATUS } = require('../config/constants');

/**
 * Message Controller
 * Mensajería directa estudiante ↔ profesor (dentro de la misma academia).
 */

const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role, avatar_url: u.avatar_url, age_range: u.age_range });

const MessageController = {
  /**
   * GET /api/messages/contacts
   * Personas con las que el usuario puede chatear.
   *  - Estudiante → staff de su academia (profesor/admin)
   *  - Profesor/admin → estudiantes de su academia
   */
  async getContacts(req, res) {
    try {
      const me = req.user;

      if (me.role === ROLES.STUDENT) {
        if (!me.tenant_id) return ApiResponse.success(res, { contacts: [] }, 'No contacts.');
        const contacts = await User.findAll({
          where: { tenant_id: me.tenant_id, role: { [Op.in]: STAFF_ROLES }, is_active: true, id: { [Op.ne]: me.id } },
          attributes: ['id', 'name', 'role', 'avatar_url', 'age_range'],
        });
        return ApiResponse.success(res, { contacts: contacts.map(publicUser) }, 'Contacts retrieved.');
      }

      // Profesor / admin
      const where = { role: ROLES.STUDENT, is_active: true, id: { [Op.ne]: me.id } };
      if (me.role !== ROLES.SUPER_ADMIN) where.tenant_id = me.tenant_id;
      const contacts = await User.findAll({
        where,
        attributes: ['id', 'name', 'role', 'avatar_url', 'age_range'],
        order: [['name', 'ASC']],
      });
      return ApiResponse.success(res, { contacts: contacts.map(publicUser) }, 'Contacts retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve contacts.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/messages/:userId
   * Hilo de conversación entre el usuario autenticado y :userId.
   * Marca como leídos los mensajes recibidos.
   */
  async getThread(req, res) {
    try {
      const me = req.user;
      const otherId = req.params.userId;

      const other = await User.findByPk(otherId, { attributes: ['id', 'name', 'role'] });
      if (!other) return ApiResponse.error(res, 'User not found.', HTTP_STATUS.NOT_FOUND);

      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { sender_id: me.id, receiver_id: otherId },
            { sender_id: otherId, receiver_id: me.id },
          ],
        },
        order: [['created_at', 'ASC']],
        limit: 200,
      });

      // Marcar como leídos los mensajes recibidos
      await Message.update(
        { read_at: new Date() },
        { where: { sender_id: otherId, receiver_id: me.id, read_at: null } }
      );

      return ApiResponse.success(res, { contact: publicUser(other), messages }, 'Conversation retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve conversation.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/messages
   * Envía un mensaje a otro usuario.
   */
  async sendMessage(req, res) {
    try {
      const me = req.user;
      const { receiver_id, body } = req.body;

      if (!receiver_id || !body || !body.trim()) {
        return ApiResponse.error(res, 'receiver_id and body are required.', HTTP_STATUS.BAD_REQUEST);
      }

      const receiver = await User.findByPk(receiver_id, { attributes: ['id', 'tenant_id', 'role', 'is_active'] });
      if (!receiver || !receiver.is_active) {
        return ApiResponse.error(res, 'Recipient not found.', HTTP_STATUS.NOT_FOUND);
      }

      // Aislamiento por academia (el super admin puede escribir a cualquiera)
      if (me.role !== ROLES.SUPER_ADMIN && receiver.tenant_id !== me.tenant_id) {
        return ApiResponse.error(res, 'You can only message users from your academy.', HTTP_STATUS.FORBIDDEN);
      }

      const message = await Message.create({
        sender_id: me.id,
        receiver_id,
        tenant_id: me.tenant_id || receiver.tenant_id || null,
        body: body.trim().slice(0, 4000),
      });

      return ApiResponse.success(res, { message }, 'Message sent.', HTTP_STATUS.CREATED);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to send message.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/messages/unread/count
   */
  async getUnreadCount(req, res) {
    try {
      const count = await Message.count({ where: { receiver_id: req.user.id, read_at: null } });
      return ApiResponse.success(res, { unread: count }, 'Unread count retrieved.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to count unread messages.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = MessageController;
