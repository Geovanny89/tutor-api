'use strict';

const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { Certificate, User, Module, Tenant, UserProgress } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { ROLES, HTTP_STATUS } = require('../config/constants');

/**
 * Certificate Controller
 * Genera certificados verificables (código + QR) al completar módulos,
 * y expone una página pública de verificación.
 */

/** Genera un código único tipo CERT-8F3K-2026 */
const generateCode = async () => {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `CERT-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${year}`;
    const exists = await Certificate.findOne({ where: { code } });
    if (!exists) return code;
  }
  return `CERT-${crypto.randomUUID().slice(0, 8).toUpperCase()}-${year}`;
};

const buildVerifyUrl = (code) => `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify/${code}`;

const CertificateController = {
  /**
   * GET /api/certificates/mine
   */
  async listMine(req, res) {
    try {
      const certificates = await Certificate.findAll({
        where: { user_id: req.user.id },
        order: [['issued_at', 'DESC']],
      });
      return ApiResponse.success(
        res,
        { certificates: certificates.map((c) => ({ ...c.toJSON(), verify_url: buildVerifyUrl(c.code) })) },
        'Certificates retrieved.'
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to retrieve certificates.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * POST /api/certificates
   * Emite un certificado.
   *  - Estudiante: para sí mismo (requiere módulo completado si se envía module_id)
   *  - Profesor/admin: para un estudiante de su academia (body.user_id)
   * Body: { module_id?, user_id?, hours?, subject? }
   */
  async issue(req, res) {
    try {
      const me = req.user;
      const { module_id, user_id, hours, subject } = req.body;

      let target = me;
      if (user_id && user_id !== me.id) {
        if (me.role === ROLES.STUDENT) {
          return ApiResponse.error(res, 'Students can only generate their own certificates.', HTTP_STATUS.FORBIDDEN);
        }
        target = await User.findByPk(user_id);
        if (!target) return ApiResponse.error(res, 'Student not found.', HTTP_STATUS.NOT_FOUND);
        if (me.role !== ROLES.SUPER_ADMIN && target.tenant_id !== me.tenant_id) {
          return ApiResponse.error(res, 'Student not found in your academy.', HTTP_STATUS.FORBIDDEN);
        }
      }

      let module = null;
      if (module_id) {
        module = await Module.findByPk(module_id);
        if (module) {
          // El estudiante debe haber completado el módulo antes de certificarlo
          const completed = await UserProgress.findOne({
            where: { user_id: target.id, module_id: module.id, status: 'completed' },
          });
          if (!completed && me.role === ROLES.STUDENT) {
            return ApiResponse.error(res, 'You must complete this module before getting its certificate.', HTTP_STATUS.BAD_REQUEST);
          }
        }
      }

      const academy = target.tenant_id ? await Tenant.findByPk(target.tenant_id) : null;

      const certificate = await Certificate.create({
        code: await generateCode(),
        user_id: target.id,
        tenant_id: target.tenant_id || null,
        module_id: module?.id || null,
        student_name: target.name,
        academy_name: academy?.name || 'KDice English',
        subject: subject || module?.subject || 'Inglés',
        level: module?.level || target.current_level || null,
        hours: hours ? Number(hours) : 10,
        meta: { primary_color: academy?.primary_color || '#059669', logo_url: academy?.logo_url || null },
      });

      return ApiResponse.success(
        res,
        { certificate: { ...certificate.toJSON(), verify_url: buildVerifyUrl(certificate.code) } },
        'Certificate issued successfully! 🎓',
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      return ApiResponse.error(res, 'Failed to issue certificate.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/certificates/verify/:code  (público)
   */
  async verify(req, res) {
    try {
      const certificate = await Certificate.findOne({ where: { code: req.params.code.toUpperCase() } });
      if (!certificate) {
        return ApiResponse.success(res, { valid: false }, 'Certificate not found.');
      }
      return ApiResponse.success(res, {
        valid: true,
        certificate: {
          code: certificate.code,
          student_name: certificate.student_name,
          academy_name: certificate.academy_name,
          subject: certificate.subject,
          level: certificate.level,
          hours: certificate.hours,
          issued_at: certificate.issued_at,
        },
      }, 'Certificate verified.');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to verify certificate.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },

  /**
   * GET /api/certificates/:code/pdf  (público)
   * Genera y descarga el certificado en PDF con código QR.
   */
  async downloadPdf(req, res) {
    try {
      const certificate = await Certificate.findOne({ where: { code: req.params.code.toUpperCase() } });
      if (!certificate) return ApiResponse.error(res, 'Certificate not found.', HTTP_STATUS.NOT_FOUND);

      const verifyUrl = buildVerifyUrl(certificate.code);
      const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 220 });
      const color = certificate.meta?.primary_color || '#059669';

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certificate.code}.pdf"`);

      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      doc.pipe(res);

      const { width, height } = doc.page;

      // Marco decorativo
      doc.rect(24, 24, width - 48, height - 48).lineWidth(3).stroke(color);
      doc.rect(36, 36, width - 72, height - 72).lineWidth(1).stroke('#cccccc');

      doc.fillColor(color).fontSize(30).font('Helvetica-Bold')
        .text('CERTIFICADO DE FINALIZACIÓN', 0, 90, { align: 'center' });

      doc.fillColor('#333333').fontSize(14).font('Helvetica')
        .text('Se otorga el presente certificado a', 0, 150, { align: 'center' });

      doc.fillColor('#000000').fontSize(34).font('Helvetica-Bold')
        .text(certificate.student_name, 0, 180, { align: 'center' });

      doc.fillColor('#333333').fontSize(14).font('Helvetica')
        .text(
          `por completar satisfactoriamente el programa de ${certificate.subject || 'Inglés'}` +
          `${certificate.level ? ` — Nivel ${certificate.level}` : ''}`,
          60, 240, { align: 'center', width: width - 120 }
        );

      doc.fontSize(12).fillColor('#555555')
        .text(`${certificate.hours} horas de práctica certificadas`, 0, 285, { align: 'center' });

      doc.fontSize(14).fillColor(color).font('Helvetica-Bold')
        .text(certificate.academy_name || 'KDice English', 0, 320, { align: 'center' });

      const issued = new Date(certificate.issued_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.fontSize(11).fillColor('#666666').font('Helvetica')
        .text(`Emitido el ${issued}`, 0, 355, { align: 'center' })
        .text(`Código de verificación: ${certificate.code}`, 0, 372, { align: 'center' })
        .text(verifyUrl, 0, 389, { align: 'center' });

      // QR
      doc.image(qrBuffer, width - 170, height - 190, { width: 120 });
      doc.fontSize(9).fillColor('#888888').text('Escanea para verificar', width - 175, height - 60, { width: 130, align: 'center' });

      doc.end();
    } catch (error) {
      return ApiResponse.error(res, 'Failed to generate certificate PDF.', HTTP_STATUS.INTERNAL_ERROR, error.message);
    }
  },
};

module.exports = CertificateController;
