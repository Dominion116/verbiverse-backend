const Joi = require('joi');

const schemas = {
  getNonce: Joi.object({
    walletAddress: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Ethereum address format'
      })
  }),

  verifySignature: Joi.object({
    walletAddress: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{40}$/)
      .required(),
    signature: Joi.string()
      .pattern(/^0x[a-fA-F0-9]{130}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid signature format'
      }),
    message: Joi.string().required()
  }),

  updateProfile: Joi.object({
    username: Joi.string().min(3).max(50).trim().optional(),
    email: Joi.string().email().optional().allow(''),
    languages: Joi.array().items(
      Joi.object({
        code: Joi.string().length(2).required(),
        name: Joi.string().required(),
        proficiency: Joi.string().valid('beginner', 'intermediate', 'advanced', 'native').required(),
        isNative: Joi.boolean().default(false)
      })
    ).optional(),
    preferences: Joi.object({
      defaultSourceLanguage: Joi.string().length(2).optional(),
      defaultTargetLanguage: Joi.string().length(2).optional(),
      difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'mixed').optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        browser: Joi.boolean().optional()
      }).optional()
    }).optional()
  })
};

module.exports = schemas;