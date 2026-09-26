/**
 * @fileoverview Middleware de validación de input y schemas Joi.
 *
 * Proporciona un middleware `validate` y los schemas de validación
 * para todos los endpoints. Los campos reutilizables se centralizan
 * en helpers para evitar duplicación.
 *
 * @module middleware/validate
 * @requires joi
 * @requires lib/constants
 */

import Joi from 'joi';
import { DESIGN_SUBCATEGORIES } from '../lib/constants.js';

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
 * Campo `email` requerido y con formato válido.
 *
 * @param {Object} [options] - Opciones del campo
 * @param {boolean} [options.withEmpty=true] - Incluye mensaje para string vacío
 * @returns {Joi.StringSchema} Campo Joi
 */
const emailField = ({ withEmpty = true } = {}) => Joi.string()
  .email()
  .required()
  .messages({
    'string.email': 'El email debe ser válido',
    'any.required': 'El email es obligatorio',
    ...(withEmpty && { 'string.empty': 'El email no puede estar vacío' }),
  });

/**
 * Campo `password` requerido con mínimo 8 caracteres.
 *
 * @param {Object} [options] - Opciones del campo
 * @param {boolean} [options.strong=false] - Exige mayúscula y símbolo
 * @returns {Joi.StringSchema} Campo Joi
 */
const passwordField = ({ strong = false } = {}) => {
  const messages = {
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'any.required': 'La contraseña es obligatoria',
    'string.empty': 'La contraseña no puede estar vacía',
  };

  let field = Joi.string().min(8);

  if (strong) {
    field = field.pattern(/^(?=.*[A-Z])(?=.*[^a-zA-Z0-9\s]).*$/);
    messages['string.pattern.base'] = 'La contraseña debe incluir al menos una letra mayúscula y un símbolo';
  }

  return field.required().messages(messages);
};

/**
 * Campo `title` requerido u opcional.
 *
 * @param {Object} [options] - Opciones del campo
 * @param {boolean} [options.required=false] - Indica si el campo es requerido
 * @returns {Joi.StringSchema} Campo Joi
 */
const titleField = ({ required = false } = {}) => {
  const base = Joi.string();
  const field = required ? base.required() : base.optional();
  return field.messages({
    ...(required && { 'any.required': 'El título es obligatorio' }),
    'string.empty': 'El título no puede estar vacío',
  });
};

/**
 * Campo de URL de imagen opcional (archivo o URL externa).
 *
 * @param {Object} [options] - Opciones del campo
 * @param {boolean} [options.withMessage=false] - Incluye mensaje de URI inválida
 * @returns {Joi.StringSchema} Campo Joi
 */
const imageUrlField = ({ withMessage = false } = {}) => {
  const field = Joi.string().uri().optional().allow('', null);
  return withMessage
    ? field.messages({ 'string.uri': 'La imagen debe ser una URL válida' })
    : field;
};

/**
 * Campo de texto opcional que permite string vacío o null.
 *
 * @returns {Joi.StringSchema} Campo Joi
 */
const optionalTextField = () => Joi.string().optional().allow('', null);

/**
 * Campo booleano opcional (isPublished, isFeatured).
 *
 * @returns {Joi.BooleanSchema} Campo Joi
 */
const booleanField = () => Joi.boolean()
  .optional()
  .empty('')
  .messages({
    'boolean.base': 'El valor debe ser booleano',
  });

/**
 * Campo `position` numérico opcional.
 *
 * Acepta strings numéricos (multipart/form-data) y trata el string
 * vacío como campo no enviado (`.empty('')`).
 *
 * @returns {Joi.NumberSchema} Campo Joi
 */
const positionField = () => Joi.number()
  .integer()
  .min(0)
  .optional()
  .empty('')
  .messages({
    'number.base': 'La posición debe ser un número',
    'number.integer': 'La posición debe ser un número entero',
    'number.min': 'La posición no puede ser negativa',
  });

/**
 * Campo `images` de exposiciones: array de URLs ya subidas vía
 * POST /admin/upload. El orden del array define el `position` de cada
 * imagen. En POST crea las imágenes anidadas; en PUT reemplaza la lista
 * completa (un array vacío la limpia). Cada elemento admite `thumbnail`,
 * `width` y `height` opcionales (null permitidos).
 *
 * @returns {Joi.ArraySchema} Campo Joi
 */
const imagesField = () => Joi.array()
  .items(
    Joi.object({
      url: Joi.string().uri().required().messages({
        'string.uri': 'La imagen debe ser una URL válida',
        'any.required': 'La url de la imagen es obligatoria',
      }),
      thumbnail: Joi.string().uri().optional().allow('', null),
      width: Joi.number().integer().positive().optional().allow(null),
      height: Joi.number().integer().positive().optional().allow(null),
    })
  )
  .max(50)
  .optional()
  .messages({
    'array.max': 'Máximo 50 imágenes por exposición',
  });

/**
 * Campo `year` numérico (1900-2100), requerido u opcional.
 *
 * Acepta strings numéricos (multipart/form-data) y trata el string
 * vacío como campo no enviado (`.empty('')`); en modo opcional
 * admite null.
 *
 * @param {Object} [options] - Opciones del campo
 * @param {boolean} [options.required=false] - Indica si el campo es requerido
 * @returns {Joi.NumberSchema} Campo Joi
 */
const yearField = ({ required = false } = {}) => {
  const base = Joi.number()
    .integer()
    .min(1900)
    .max(2100)
    .empty('');
  const field = required ? base.required() : base.optional().allow(null);
  return field.messages({
    ...(required && { 'any.required': 'El año es obligatorio' }),
  });
};

/**
 * Campo `subcategory` requerido u opcional, validado contra constantes.
 *
 * @param {Object} [options] - Opciones del campo
 * @param {boolean} [options.required=false] - Indica si el campo es requerido
 * @returns {Joi.StringSchema} Campo Joi
 */
const subcategoryField = ({ required = false } = {}) => {
  const base = Joi.string().valid(...DESIGN_SUBCATEGORIES);
  const field = required ? base.required() : base.optional();
  return field.messages({
    ...(required && {
      'any.required': 'La subcategoría es obligatoria',
      'string.empty': 'La subcategoría no puede estar vacía',
    }),
    'any.only': `La subcategoría debe ser: ${DESIGN_SUBCATEGORIES.join(', ')}`,
  });
};

/**
 * Campo `date` ISO requerido u opcional.
 *
 * @param {Object} [options] - Opciones del campo
 * @param {boolean} [options.required=false] - Indica si el campo es requerido
 * @returns {Joi.DateSchema} Campo Joi
 */
const dateField = ({ required = false } = {}) => {
  const base = Joi.date().iso().empty('');
  const field = required ? base.required() : base.optional();
  return field.messages({
    ...(required && { 'any.required': 'La fecha es obligatoria' }),
    'date.base': 'La fecha debe ser válida',
    'date.format': 'La fecha debe ser válida',
  });
};

/**
 * Campo de fecha de fin (opcional). `minDateRef` añade la regla de no ser
 * anterior a `date` (solo se usa en creación, donde `date` es obligatoria;
 * en PUT parciales sin `date` no hay referencia contra la que comparar).
 * @param {{ minDateRef?: boolean }} [options]
 * @returns {Joi.DateSchema}
 */
const endDateField = ({ minDateRef = false } = {}) => {
  const base = Joi.date().iso().empty('');
  const field = minDateRef ? base.min(Joi.ref('date')) : base;
  return field.messages({
    'date.base': 'La fecha de fin debe ser válida',
    'date.format': 'La fecha de fin debe ser válida',
    'date.min': 'La fecha de fin no puede ser anterior a la fecha de inicio',
  });
};

/**
 * Schema de validación para login
 * @type {Joi.ObjectSchema}
 */
const loginSchema = Joi.object({
  email: emailField(),
  password: passwordField(),
});

/**
 * Schema de validación para registro de administradores
 * @type {Joi.ObjectSchema}
 */
const registerSchema = Joi.object({
  email: emailField(),
  password: passwordField({ strong: true }),
  name: Joi.string()
    .optional()
    .messages({
      'string.base': 'El nombre debe ser una cadena de texto',
      'string.empty': 'El nombre no puede estar vacío',
    }),
});

/**
 * Schema de validación para actualizar usuario (campos opcionales)
 * @type {Joi.ObjectSchema}
 */
const userUpdateSchema = Joi.object({
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'El email debe ser válido',
      'string.empty': 'El email no puede estar vacío',
    }),
  name: Joi.string()
    .optional()
    .allow(null)
    .messages({
      'string.base': 'El nombre debe ser una cadena de texto',
      'string.empty': 'El nombre no puede estar vacío',
    }),
  role: Joi.string()
    .optional()
    .messages({
      'string.base': 'El rol debe ser una cadena de texto',
      'string.empty': 'El rol no puede estar vacío',
    })
    .custom((value, helpers) => {
      if (!['ADMIN', 'USER'].includes(value)) {
        return helpers.message('El rol debe ser ADMIN o USER');
      }
      return value;
    }),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
});

/**
 * Schema de validación para resetear contraseña de usuario
 * @type {Joi.ObjectSchema}
 */
const passwordResetSchema = Joi.object({
  password: passwordField({ strong: true }),
});

/**
 * Schema de validación para colecciones
 * @type {Joi.ObjectSchema}
 */
const collectionSchema = Joi.object({
  title: titleField({ required: true }),
  description: optionalTextField(),
  coverImage: imageUrlField(),
  position: positionField(),
  isPublished: Joi.boolean()
    .optional()
    .empty('')
    .messages({
      'boolean.base': 'isPublished debe ser un booleano',
    }),
});

/**
 * Schema de validación para pinturas
 * imageUrl es opcional porque puede venir de un archivo upload;
 * year es obligatorio al crear
 * @type {Joi.ObjectSchema}
 */
const paintingSchema = Joi.object({
  title: titleField({ required: true }),
  imageUrl: imageUrlField({ withMessage: true }),
  collectionId: Joi.number()
    .integer()
    .positive()
    .required()
    .empty('')
    .messages({
      'any.required': 'La colección es obligatoria',
      'number.base': 'La colección debe ser un número',
    }),
  dimensions: optionalTextField(),
  technique: optionalTextField(),
  year: yearField({ required: true }),
  isPublished: booleanField(),
  isFeatured: booleanField(),
});

/**
 * Schema de validación para actualizar pintura (campos opcionales)
 * @type {Joi.ObjectSchema}
 */
const paintingUpdateSchema = Joi.object({
  title: titleField(),
  imageUrl: imageUrlField({ withMessage: true }),
  collectionId: Joi.number()
    .integer()
    .positive()
    .optional()
    .empty('')
    .messages({
      'number.base': 'La colección debe ser un número',
    }),
  dimensions: optionalTextField(),
  technique: optionalTextField(),
  year: yearField(),
  isPublished: booleanField(),
  isFeatured: booleanField(),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
});

/**
 * Schema de validación para exposiciones
 * @type {Joi.ObjectSchema}
 */
const exhibitionSchema = Joi.object({
  title: titleField({ required: true }),
  date: dateField({ required: true }),
  endDate: endDateField({ minDateRef: true }),
  location: optionalTextField(),
  description: optionalTextField(),
  position: positionField(),
  isPublished: booleanField(),
  images: imagesField(),
});

/**
 * Schema de validación para actualizar exposición (campos opcionales)
 * @type {Joi.ObjectSchema}
 */
const exhibitionUpdateSchema = Joi.object({
  title: titleField(),
  date: dateField(),
  endDate: endDateField().allow(null),
  location: optionalTextField(),
  description: optionalTextField(),
  position: positionField(),
  isPublished: booleanField(),
  images: imagesField(),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
});

/**
 * Schema de validación para proyectos de diseño
 * @type {Joi.ObjectSchema}
 */
const designSchema = Joi.object({
  title: titleField({ required: true }),
  subcategory: subcategoryField({ required: true }),
  imageUrl: imageUrlField({ withMessage: true }),
  description: optionalTextField(),
  isPublished: booleanField(),
  isFeatured: booleanField(),
});

/**
 * Schema de validación para actualizar proyecto de diseño (campos opcionales)
 * @type {Joi.ObjectSchema}
 */
const designUpdateSchema = Joi.object({
  title: titleField(),
  subcategory: subcategoryField(),
  imageUrl: imageUrlField({ withMessage: true }),
  description: optionalTextField(),
  isPublished: booleanField(),
  isFeatured: booleanField(),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
});

/**
 * Schema de validación para ilustraciones
 * @type {Joi.ObjectSchema}
 */
const illustrationSchema = Joi.object({
  title: titleField({ required: true }),
  imageUrl: imageUrlField({ withMessage: true }),
  description: optionalTextField(),
  isPublished: booleanField(),
  isFeatured: booleanField(),
});

/**
 * Schema de validación para actualizar ilustración (campos opcionales)
 * @type {Joi.ObjectSchema}
 */
const illustrationUpdateSchema = Joi.object({
  title: titleField(),
  imageUrl: imageUrlField({ withMessage: true }),
  description: optionalTextField(),
  isPublished: booleanField(),
  isFeatured: booleanField(),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
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
  imageUrl: imageUrlField(),
});

/**
 * Schema de validación para actualizar biografía parcialmente.
 * @type {Joi.ObjectSchema}
 */
const biographyUpdateSchema = Joi.object({
  content: Joi.string()
    .min(10)
    .optional()
    .messages({
      'string.min': 'El contenido debe tener al menos 10 caracteres',
      'string.empty': 'El contenido no puede estar vacío',
    }),
  imageUrl: imageUrlField(),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
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
  email: emailField(),
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
 * Schema de validación para solicitud de recuperación de contraseña
 * @type {Joi.ObjectSchema}
 */
const forgotPasswordSchema = Joi.object({
  email: emailField(),
});

/**
 * Schema de validación para restablecer contraseña con token
 * @type {Joi.ObjectSchema}
 */
const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'El token es obligatorio',
      'string.empty': 'El token no puede estar vacío',
    }),
  password: passwordField({ strong: true }),
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
  userUpdateSchema,
  passwordResetSchema,
  collectionSchema,
  paintingSchema,
  paintingUpdateSchema,
  exhibitionSchema,
  exhibitionUpdateSchema,
  designSchema,
  designUpdateSchema,
  illustrationSchema,
  illustrationUpdateSchema,
  biographySchema,
  biographyUpdateSchema,
  contactSchema,
  reorderSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
