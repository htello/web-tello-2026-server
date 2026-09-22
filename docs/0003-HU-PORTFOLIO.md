# Guion de Historias de Usuario - Portfolio Artístico

## Roles del Sistema

* **Visitante (Público):** Navega por el portfolio, explora las colecciones de pintura, filtra piezas por disciplina, consulta la biografía y envía mensajes de contacto.
* **Administrador (Artista):** Usuario autenticado con permisos para crear, editar, eliminar y reordenar contenidos, administrar archivos y configurar aspectos de visibilidad y destacado.

---

## 1. Sección Pintura y Exposiciones

* **HU01 - Galería de Colecciones (Nivel 1):** Como visitante, al ingresar a la sección de Pintura quiero ver el catálogo general de colecciones públicas (`isPublished: true`) ordenadas por prioridad (`position`), incluyendo imagen de portada, título y texto de presentación opcional.
* **HU02 - Detalle de Colección (Nivel 2):** Como visitante, al seleccionar una colección quiero acceder a su vista detallada para explorar únicamente las pinturas asignadas a dicha colección.
* **HU03 - Ficha de Pintura:** Como visitante, dentro de una colección quiero visualizar la imagen de cada pintura junto a sus datos técnicos (título, dimensiones, técnica y año), omitiendo dinámicamente cualquier campo que no haya sido registrado.
* **HU04 - Obras Destacadas y Lightbox:** Como visitante, quiero visualizar en la portada principal las obras marcadas como destacadas (`isFeatured: true`) y abrir cualquier pintura en un visor flotante a pantalla completa con protección anti-descarga.
* **HU05 - Consultar Exposiciones:** Como visitante, dentro del apartado de pintura quiero explorar el historial de exposiciones ordenadas según la prioridad asignada (`position`).
* **HU06 - Gestión de Colecciones y Pinturas (Admin):** Como administrador, quiero crear, editar, eliminar, reordenar (`position`), marcar como destacadas (`isFeatured`) y alternar visibilidad (`isPublished`) en colecciones y pinturas.
* **HU07 - Gestión de Exposiciones (Admin):** Como administrador, quiero crear, editar, eliminar o reordenar manualmente (`position`) las fichas de exposiciones pasadas o futuras.

---

## 2. Sección Diseño e Ilustración

* **HU08 - Filtrar Proyectos de Diseño:** Como visitante, quiero navegar por el trabajo de diseño filtrando por sus subcategorías (Imagen Corporativa, Packaging, Expositores, Cartelería, Editorial) para enfocar la búsqueda en piezas específicas.
* **HU09 - Explorar Galería de Ilustración:** Como visitante, quiero explorar las piezas de ilustración centradas en su impacto visual y bajo medidas de protección anti-descarga.
* **HU10 - Gestión de Diseño e Ilustración (Admin):** Como administrador, quiero subir, editar, eliminar y clasificar proyectos de diseño e ilustración definiendo su categoría y subcategoría.

---

## 3. Sección Biografía

* **HU11 - Leer Biografía:** Como visitante, quiero consultar el perfil biográfico y trayectoria del artista en texto plano integrado en la propia página web.
* **HU12 - Editar Biografía (Admin):** Como administrador, quiero actualizar el contenido textual de la biografía desde el panel de administración.

---

## 4. Sección Contacto y Anti-Spam

* **HU13 - Enviar Formulario:** Como visitante, quiero enviar un mensaje con mi nombre, email, asunto y texto para comunicarme directamente con el artista.
* **HU14 - Envío Directo por Email:** Como sistema, debo despachar el correo del formulario directamente a la bandeja de entrada del administrador vía Nodemailer sin almacenar la información en la base de datos.
* **HU15 - Protección Anti-Spam:** Como sistema, debo aplicar restricción de tasa de peticiones (*rate limiting*) en el endpoint de contacto para prevenir el uso indebido por bots.

---

## 5. Gestión de Archivos y Protección de Contenido

* **HU16 - Carga y Optimización de Archivos (Admin):** Como administrador, quiero subir imágenes (obras, portadas de colecciones, exposiciones) procesadas mediante Multer y Cloudinary/S3 para generar versiones optimizadas para web.
* **HU17 - Protección Anti-Descarga (Frontend):** Como sistema, debo superponer capas transparentes, deshabilitar el menú contextual (clic derecho) y bloquear la acción de arrastrar imágenes (*drag & drop*) para impedir la descarga directa.

---

## 6. Sistema, SEO y Monitoreo

* **HU18 - Metadatos Open Graph / SEO:** Como sistema, debo entregar etiquetas SEO y Open Graph para generar vistas previas correctas al compartir enlaces de obras en redes sociales.
* **HU19 - Monitor de Estado de la API:** Como sistema, debo exponer el endpoint `GET /api/health` con respuesta `{ status: "ok" }` para la comprobación del estado del servidor por servicios de despliegue.

---

## 7. Autenticación y Seguridad

* **HU20 - Inicio de Sesión de Administrador:** Como administrador, quiero autenticarme mediante email y contraseña cifrada (`bcryptjs`) para obtener un token de acceso seguro (JWT).
* **HU21 - Protección de Rutas:** Como sistema, debo bloquear mediante middleware cualquier intento de creación, modificación o eliminación (`POST`, `PUT`, `DELETE`) realizado sin un token JWT válido (respuestas `HTTP 401/403`).
* **HU22 - Registro de Administradores:** Como administrador autenticado, quiero registrar nuevos usuarios administradores para que también puedan gestionar el contenido del portfolio. Los nuevos usuarios siempre tendrán rol `ADMIN`.