/**
 * @fileoverview Seed aditivo e idempotente de la base de datos del portfolio.
 * Conserva los datos existentes del usuario (Cloudinary) y los enriquece,
 * añadiendo datos reales con URLs de Wikimedia Commons (no se sube nada a Cloudinary).
 * @module prisma/seed
 * @security No hardcodea secretos salvo la contraseña de desarrollo del admin.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  NEW_COLLECTIONS,
  COLLECTION_TOPUP,
  NEW_ILLUSTRATIONS,
  NEW_DESIGNS,
  NEW_EXHIBITIONS,
  EXHIBITION_TOPUP,
  ENRICH,
  BIOGRAPHY,
} from './seed-data.js';

const prisma = new PrismaClient();

const hashPassword = async (password) => bcrypt.hash(password, 12);

/**
 * Construye un objeto de actualización con solo los campos que están null/undefined.
 * @param {object} current Registro actual de la base de datos.
 * @param {object} values Valores deseados.
 * @returns {object} Objeto con únicamente los campos a rellenar.
 */
const onlyMissing = (current, values) => {
  const patch = {};
  for (const [key, value] of Object.entries(values)) {
    if (current[key] === null || current[key] === undefined) patch[key] = value;
  }
  return patch;
};

/**
 * Garantiza la existencia del usuario administrador sin borrar datos previos.
 * @returns {Promise<void>}
 */
const seedAdmin = async () => {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
  if (existing) {
    console.log('ℹ️  Usuario admin ya existe, se conserva.');
    return;
  }
  const password = await hashPassword('Admin123!');
  await prisma.user.create({
    data: { email: 'admin@test.com', password, name: 'Administrador', role: 'ADMIN' },
  });
  console.log('✅ Usuario admin creado: admin@test.com');
};

/**
 * Enriquece colecciones, pinturas, ilustraciones, diseños y exposiciones del usuario.
 * Solo rellena campos vacíos; nunca sobrescribe datos existentes ni elimina registros.
 * @returns {Promise<void>}
 */
const enrichUserData = async () => {
  let touched = 0;

  for (const [title, values] of Object.entries(ENRICH.collections)) {
    const col = await prisma.collection.findFirst({ where: { title } });
    if (!col) continue;
    const patch = onlyMissing(col, values);
    if (Object.keys(patch).length) {
      await prisma.collection.update({ where: { id: col.id }, data: patch });
      touched += 1;
    }
  }

  for (const [key, values] of Object.entries(ENRICH.paintings)) {
    const found = await prisma.painting.findMany({ where: { imageUrl: { contains: key } } });
    for (const row of found) {
      const patch = onlyMissing(row, values);
      if (Object.keys(patch).length) {
        await prisma.painting.update({ where: { id: row.id }, data: patch });
        touched += 1;
      }
    }
  }

  for (const [key, description] of Object.entries(ENRICH.illustrations)) {
    const found = await prisma.illustration.findMany({ where: { imageUrl: { contains: key } } });
    for (const row of found) {
      const patch = onlyMissing(row, { description });
      if (Object.keys(patch).length) {
        await prisma.illustration.update({ where: { id: row.id }, data: patch });
        touched += 1;
      }
    }
  }

  for (const [key, description] of Object.entries(ENRICH.designs)) {
    const found = await prisma.designProject.findMany({ where: { imageUrl: { contains: key } } });
    for (const row of found) {
      const patch = onlyMissing(row, { description });
      if (Object.keys(patch).length) {
        await prisma.designProject.update({ where: { id: row.id }, data: patch });
        touched += 1;
      }
    }
  }

  for (const [title, description] of Object.entries(ENRICH.exhibitions)) {
    const exh = await prisma.exhibition.findFirst({ where: { title } });
    if (!exh) continue;
    const patch = onlyMissing(exh, { description });
    if (Object.keys(patch).length) {
      await prisma.exhibition.update({ where: { id: exh.id }, data: patch });
      touched += 1;
    }
  }

  console.log(`✅ Enriquecidos ${touched} registros existentes del usuario`);
};

/**
 * Obtiene o crea una colección por título.
 * @param {object} data Datos de la colección.
 * @returns {Promise<number>} Id de la colección.
 */
const ensureCollection = async (data) => {
  const existing = await prisma.collection.findFirst({ where: { title: data.title } });
  if (existing) return existing.id;
  const created = await prisma.collection.create({
    data: {
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      position: data.position,
      isPublished: data.isPublished ?? true,
    },
  });
  return created.id;
};

/**
 * Crea una pintura si no existe (title + collectionId únicos).
 * @param {object} p Datos de la pintura.
 * @param {number} collectionId Id de la colección destino.
 * @returns {Promise<boolean>} true si se creó.
 */
const ensurePainting = async (p, collectionId) => {
  const existing = await prisma.painting.findFirst({ where: { title: p.title, collectionId } });
  if (existing) return false;
  await prisma.painting.create({
    data: {
      title: p.title,
      imageUrl: p.imageUrl,
      dimensions: p.dimensions,
      technique: p.technique,
      year: p.year,
      isFeatured: p.isFeatured,
      isPublished: p.isPublished ?? true,
      position: p.position,
      collectionId,
    },
  });
  return true;
};

/**
 * Siembra colecciones nuevas y completa las existentes del usuario.
 * @returns {Promise<void>}
 */
const seedPaintings = async () => {
  let newCollections = 0;
  let newPaintings = 0;

  for (const col of NEW_COLLECTIONS) {
    const existed = await prisma.collection.findFirst({ where: { title: col.title } });
    const collectionId = await ensureCollection(col);
    if (!existed) newCollections += 1;
    for (const p of col.paintings) {
      if (await ensurePainting(p, collectionId)) newPaintings += 1;
    }
  }

  for (const [title, paintings] of Object.entries(COLLECTION_TOPUP)) {
    const col = await prisma.collection.findFirst({ where: { title } });
    if (!col) continue;
    for (const p of paintings) {
      if (await ensurePainting(p, col.id)) newPaintings += 1;
    }
  }

  console.log(`✅ ${newCollections} colecciones nuevas, ${newPaintings} pinturas nuevas`);
};

/**
 * Siembra ilustraciones reales omitiendo las ya existentes.
 * @returns {Promise<void>}
 */
const seedIllustrations = async () => {
  let created = 0;
  for (const ill of NEW_ILLUSTRATIONS) {
    const existing = await prisma.illustration.findFirst({ where: { imageUrl: ill.imageUrl } });
    if (existing) continue;
    await prisma.illustration.create({
      data: {
        title: ill.title,
        description: ill.description,
        imageUrl: ill.imageUrl,
        isFeatured: ill.isFeatured,
        isPublished: ill.isPublished ?? true,
        position: ill.position,
      },
    });
    created += 1;
  }
  console.log(`✅ ${created} ilustraciones nuevas`);
};

/**
 * Siembra proyectos de diseño por subcategoría omitiendo los ya existentes.
 * @returns {Promise<void>}
 */
const seedDesigns = async () => {
  let created = 0;
  for (const d of NEW_DESIGNS) {
    const existing = await prisma.designProject.findFirst({ where: { imageUrl: d.imageUrl } });
    if (existing) continue;
    await prisma.designProject.create({
      data: {
        title: d.title,
        description: d.description,
        imageUrl: d.imageUrl,
        subcategory: d.subcategory,
        isFeatured: d.isFeatured,
        isPublished: d.isPublished ?? true,
        position: d.position,
      },
    });
    created += 1;
  }
  console.log(`✅ ${created} proyectos de diseño nuevos`);
};

/**
 * Añade una imagen de exposición si no existe para esa exposición y URL.
 * @param {object} img Datos de la imagen.
 * @param {number} exhibitionId Id de la exposición.
 * @returns {Promise<boolean>} true si se creó.
 */
const ensureExhibitionImage = async (img, exhibitionId) => {
  const existing = await prisma.exhibitionImage.findFirst({ where: { exhibitionId, url: img.url } });
  if (existing) return false;
  await prisma.exhibitionImage.create({
    data: {
      exhibitionId,
      url: img.url,
      thumbnail: img.thumbnail,
      width: img.width,
      height: img.height,
      position: img.position,
    },
  });
  return true;
};

/**
 * Siembra exposiciones nuevas y completa las imágenes de las existentes.
 * @returns {Promise<void>}
 */
const seedExhibitions = async () => {
  let newExh = 0;
  let newImg = 0;

  for (const e of NEW_EXHIBITIONS) {
    let exh = await prisma.exhibition.findFirst({ where: { title: e.title } });
    if (!exh) {
      exh = await prisma.exhibition.create({
        data: {
          title: e.title,
          date: new Date(e.date),
          endDate: new Date(e.endDate),
          location: e.location,
          description: e.description,
          position: e.position,
          isPublished: e.isPublished ?? true,
        },
      });
      newExh += 1;
    }
    for (const img of e.images) {
      if (await ensureExhibitionImage(img, exh.id)) newImg += 1;
    }
  }

  for (const [title, images] of Object.entries(EXHIBITION_TOPUP)) {
    const exh = await prisma.exhibition.findFirst({ where: { title } });
    if (!exh) continue;
    for (const img of images) {
      if (await ensureExhibitionImage(img, exh.id)) newImg += 1;
    }
  }

  console.log(`✅ ${newExh} exposiciones nuevas, ${newImg} imágenes de exposición nuevas`);
};

/**
 * Crea la biografía solo si aún no existe ninguna.
 * @returns {Promise<void>}
 */
const seedBiography = async () => {
  const count = await prisma.biography.count();
  if (count > 0) {
    console.log('ℹ️  Biografía ya existe, se conserva.');
    return;
  }
  await prisma.biography.create({ data: { content: BIOGRAPHY.content, imageUrl: BIOGRAPHY.imageUrl } });
  console.log('✅ Biografía creada');
};

/**
 * Ejecuta el seed completo de forma aditiva e idempotente.
 * @returns {Promise<void>}
 */
const main = async () => {
  console.log('🌱 Iniciando seed (aditivo, no destructivo)...');
  await seedAdmin();
  await enrichUserData();
  await seedPaintings();
  await seedIllustrations();
  await seedDesigns();
  await seedExhibitions();
  await seedBiography();
  console.log('\n🎉 Seed completado. Login admin: admin@test.com / Admin123!');
};

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
