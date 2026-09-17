import Joi from 'joi';

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join('. ');
    return res.status(400).json({
      error: errorMessage,
      code: 'VALIDATION_ERROR',
    });
  }

  req.body = value;
  next();
};

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'El email debe ser válido',
      'any.required': 'El email es obligatorio',
      'string.empty': 'El email no puede estar vacío',
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'any.required': 'La contraseña es obligatoria',
      'string.empty': 'La contraseña no puede estar vacía',
    }),
});

export { validate, loginSchema };
