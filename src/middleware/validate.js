import Joi from 'joi';

/**
 * Middleware de validación de input
 * Usa Joi para validar el body de las peticiones
 *
 * @param {Joi.Schema} schema - Schema de Joi para validación
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.post('/login', validate(loginSchema), controller);
 */
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

/**
 * Schema de validación para login
 * @type {Joi.ObjectSchema}
 *
 * @property {string} email - Email válido (requerido)
 * @property {string} password - Mínimo 8 caracteres (requerido)
 */
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

/**
 * Schema de validación para registro de administradores
 * @type {Joi.ObjectSchema}
 *
 * @property {string} email - Email válido (requerido)
 * @property {string} password - Mínimo 8 caracteres (requerido)
 * @property {string} name - Nombre del usuario (opcional)
 */
const registerSchema = Joi.object({
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
  name: Joi.string()
    .optional()
    .messages({
      'string.base': 'El nombre debe ser una cadena de texto',
    }),
});

/**
 * Schema de validación para colecciones
 * @type {Joi.ObjectSchema}
 */
const collectionSchema = Joi.object({
  title: Joi.string()
    .required()
    .messages({
      'any.required': 'El título es obligatorio',
      'string.empty': 'El título no puede estar vacío',
    }),
  description: Joi.string()
    .optional()
    .allow('', null),
  coverImage: Joi.string()
    .uri()
    .optional()
    .allow('', null),
});

/**
 * Schema de validación para pinturas
 * @type {Joi.ObjectSchema}
 */
const paintingSchema = Joi.object({
  title: Joi.string()
    .required()
    .messages({
      'any.required': 'El título es obligatorio',
      'string.empty': 'El título no puede estar vacío',
    }),
  imageUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'any.required': 'La imagen es obligatoria',
      'string.uri': 'La imagen debe ser una URL válida',
    }),
  collectionId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'La colección es obligatoria',
      'number.base': 'La colección debe ser un número',
    }),
  dimensions: Joi.string()
    .optional()
    .allow('', null),
  technique: Joi.string()
    .optional()
    .allow('', null),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(2100)
    .optional()
    .allow(null),
});

/**
 * Schema de validación para exposiciones
 * @type {Joi.ObjectSchema}
 */
const exhibitionSchema = Joi.object({
  title: Joi.string()
    .required()
    .messages({
      'any.required': 'El título es obligatorio',
      'string.empty': 'El título no puede estar vacío',
    }),
  date: Joi.date()
    .iso()
    .required()
    .messages({
      'any.required': 'La fecha es obligatoria',
      'date.base': 'La fecha debe ser válida',
    }),
  location: Joi.string()
    .optional()
    .allow('', null),
  description: Joi.string()
    .optional()
    .allow('', null),
});

/**
 * Schema de validación para proyectos de diseño
 * @type {Joi.ObjectSchema}
 */
const designSchema = Joi.object({
  title: Joi.string()
    .required()
    .messages({
      'any.required': 'El título es obligatorio',
      'string.empty': 'El título no puede estar vacío',
    }),
  category: Joi.string()
    .required()
    .messages({
      'any.required': 'La categoría es obligatoria',
      'string.empty': 'La categoría no puede estar vacía',
    }),
  subcategory: Joi.string()
    .required()
    .messages({
      'any.required': 'La subcategoría es obligatoria',
      'string.empty': 'La subcategoría no puede estar vacía',
    }),
  imageUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'any.required': 'La imagen es obligatoria',
      'string.uri': 'La imagen debe ser una URL válida',
    }),
  description: Joi.string()
    .optional()
    .allow('', null),
});

/**
 * Schema de validación para ilustraciones
 * @type {Joi.ObjectSchema}
 */
const illustrationSchema = Joi.object({
  title: Joi.string()
    .required()
    .messages({
      'any.required': 'El título es obligatorio',
      'string.empty': 'El título no puede estar vacío',
    }),
  imageUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'any.required': 'La imagen es obligatoria',
      'string.uri': 'La imagen debe ser una URL válida',
    }),
  description: Joi.string()
    .optional()
    .allow('', null),
});

/**
 * Schema de validación para biografía
 * @type {Joi.ObjectSchema}
 */
const biographySchema = Joi.object({
  content: Joi.string()
    .min(10)
    .required()
    .messages({
      'any.required': 'El contenido es obligatorio',
      'string.min': 'El contenido debe tener al menos 10 caracteres',
      'string.empty': 'El contenido no puede estar vacío',
    }),
  imageUrl: Joi.string()
    .uri()
    .optional()
    .allow('', null),
});

/**
 * Schema de validación para formulario de contacto
 * @type {Joi.ObjectSchema}
 */
const contactSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({
      'any.required': 'El nombre es obligatorio',
      'string.empty': 'El nombre no puede estar vacío',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'El email debe ser válido',
      'any.required': 'El email es obligatorio',
    }),
  subject: Joi.string()
    .required()
    .messages({
      'any.required': 'El asunto es obligatorio',
      'string.empty': 'El asunto no puede estar vacío',
    }),
  message: Joi.string()
    .min(10)
    .required()
    .messages({
      'any.required': 'El mensaje es obligatorio',
      'string.min': 'El mensaje debe tener al menos 10 caracteres',
      'string.empty': 'El mensaje no puede estar vacío',
    }),
});

/**
 * Schema de validación para reorder
 * @type {Joi.ObjectSchema}
 */
const reorderSchema = Joi.object({
  orderedIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'any.required': 'Los IDs son obligatorios',
      'array.min': 'Debe haber al menos un elemento',
    }),
});

export {
  validate,
  loginSchema,
  registerSchema,
  collectionSchema,
  paintingSchema,
  exhibitionSchema,
  designSchema,
  illustrationSchema,
  biographySchema,
  contactSchema,
  reorderSchema,
};
