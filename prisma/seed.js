import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

const main = async () => {
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes
  await prisma.illustration.deleteMany();
  await prisma.designProject.deleteMany();
  await prisma.exhibition.deleteMany();
  await prisma.painting.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.biography.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuario admin
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Usuario admin creado: ${admin.email}`);

  // Crear colecciones
  const collections = await Promise.all([
    prisma.collection.create({
      data: {
        title: 'Óleos',
        description: 'Colección de óleos sobre lienzo',
        coverImage: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        position: 1,
        isPublished: true,
      },
    }),
    prisma.collection.create({
      data: {
        title: 'Acuarelas',
        description: 'Colección de acuarelas sobre papel',
        coverImage: 'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
        position: 2,
        isPublished: true,
      },
    }),
    prisma.collection.create({
      data: {
        title: 'Esculturas',
        description: 'Colección de esculturas en diversos materiales',
        coverImage: 'https://res.cloudinary.com/demo/image/upload/sample3.jpg',
        position: 3,
        isPublished: true,
      },
    }),
  ]);
  console.log(`✅ ${collections.length} colecciones creadas`);

  // Crear pinturas
  const paintings = await Promise.all([
    prisma.painting.create({
      data: {
        title: 'Atardecer',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting1.jpg',
        dimensions: '80x60 cm',
        technique: 'Óleo sobre lienzo',
        year: 2024,
        isFeatured: true,
        isPublished: true,
        position: 1,
        collectionId: collections[0].id,
      },
    }),
    prisma.painting.create({
      data: {
        title: 'Amanecer en la montaña',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting2.jpg',
        dimensions: '100x70 cm',
        technique: 'Óleo sobre lienzo',
        year: 2023,
        isFeatured: true,
        isPublished: true,
        position: 2,
        collectionId: collections[0].id,
      },
    }),
    prisma.painting.create({
      data: {
        title: 'Bosque encantado',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting3.jpg',
        dimensions: '60x45 cm',
        technique: 'Acuarela sobre papel',
        year: 2024,
        isFeatured: false,
        isPublished: true,
        position: 1,
        collectionId: collections[1].id,
      },
    }),
    prisma.painting.create({
      data: {
        title: 'Retrato abstracto',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting4.jpg',
        dimensions: '50x50 cm',
        technique: 'Óleo sobre lienzo',
        year: 2023,
        isFeatured: true,
        isPublished: true,
        position: 3,
        collectionId: collections[0].id,
      },
    }),
    prisma.painting.create({
      data: {
        title: 'Naturaleza muerta',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting5.jpg',
        dimensions: '70x50 cm',
        technique: 'Acuarela sobre papel',
        year: 2024,
        isFeatured: false,
        isPublished: true,
        position: 2,
        collectionId: collections[1].id,
      },
    }),
    prisma.painting.create({
      data: {
        title: 'Paisaje urbano',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting6.jpg',
        dimensions: '90x60 cm',
        technique: 'Óleo sobre lienzo',
        year: 2022,
        isFeatured: false,
        isPublished: true,
        position: 4,
        collectionId: collections[0].id,
      },
    }),
    prisma.painting.create({
      data: {
        title: 'Flor de loto',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting7.jpg',
        dimensions: '40x40 cm',
        technique: 'Acuarela sobre papel',
        year: 2024,
        isFeatured: true,
        isPublished: true,
        position: 3,
        collectionId: collections[1].id,
      },
    }),
    prisma.painting.create({
      data: {
        title: 'Formas orgánicas',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting8.jpg',
        dimensions: '120x80 cm',
        technique: 'Escultura en bronce',
        year: 2023,
        isFeatured: false,
        isPublished: true,
        position: 1,
        collectionId: collections[2].id,
      },
    }),
    prisma.painting.create({
      data: {
        title: 'Equilibrio',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting9.jpg',
        dimensions: '60x40x30 cm',
        technique: 'Escultura en madera',
        year: 2024,
        isFeatured: true,
        isPublished: true,
        position: 2,
        collectionId: collections[2].id,
      },
    }),
    prisma.painting.create({
      data: {
        title: 'Fragmentos',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/painting10.jpg',
        dimensions: '80x60x50 cm',
        technique: 'Escultura en cerámica',
        year: 2022,
        isFeatured: false,
        isPublished: true,
        position: 3,
        collectionId: collections[2].id,
      },
    }),
  ]);
  console.log(`✅ ${paintings.length} pinturas creadas`);

  // Crear exposiciones
  const exhibitions = await Promise.all([
    prisma.exhibition.create({
      data: {
        title: 'Muestra Colectiva 2024',
        date: new Date('2024-06-15'),
        location: 'Galería Central, Madrid',
        description: 'Exposición colectiva de arte contemporáneo',
        position: 1,
      },
    }),
    prisma.exhibition.create({
      data: {
        title: 'Individual: Raíces',
        date: new Date('2024-09-20'),
        location: 'Sala de Arte Moderno, Barcelona',
        description: 'Exposición individual explorando raíces y identidad',
        position: 2,
      },
    }),
    prisma.exhibition.create({
      data: {
        title: 'Art Basel Miami',
        date: new Date('2023-12-05'),
        location: 'Miami Beach Convention Center',
        description: 'Participación en la feria de arte más importante de América',
        position: 3,
      },
    }),
    prisma.exhibition.create({
      data: {
        title: 'Premios de Arte Contemporáneo',
        date: new Date('2025-03-10'),
        location: 'Museo Nacional, Madrid',
        description: 'Exposición de finalistas del premio',
        position: 4,
      },
    }),
    prisma.exhibition.create({
      data: {
        title: 'Futura: Nuevos Medios',
        date: new Date('2025-11-15'),
        location: 'Centro de Arte Digital, Valencia',
        description: 'Exploración de nuevas tecnologías en arte',
        position: 5,
      },
    }),
  ]);
  console.log(`✅ ${exhibitions.length} exposiciones creadas`);

  // Crear proyectos de diseño
  const designProjects = await Promise.all([
    prisma.designProject.create({
      data: {
        title: 'Branding Café Aroma',
        description: 'Proyecto de identidad visual para café artesanal',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/design1.jpg',
        subcategory: 'imagen-corporativa',
      },
    }),
    prisma.designProject.create({
      data: {
        title: 'Packaging Vino Reserva',
        description: 'Diseño de etiquetas y embalaje para vino premium',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/design2.jpg',
        subcategory: 'packaging-expositores',
      },
    }),
    prisma.designProject.create({
      data: {
        title: 'Cartel Festival de Música',
        description: 'Diseño de cartel para festival de música indie',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/design3.jpg',
        subcategory: 'carteleria',
      },
    }),
    prisma.designProject.create({
      data: {
        title: 'Catálogo Editorial 2025',
        description: 'Diseño editorial de catálogo de obra gráfica',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/design4.jpg',
        subcategory: 'editorial',
      },
    }),
  ]);
  console.log(`✅ ${designProjects.length} proyectos de diseño creados`);

  // Crear ilustraciones
  const illustrations = await Promise.all([
    prisma.illustration.create({
      data: {
        title: 'Bosque Encantado',
        description: 'Ilustración digital de un bosque mágico',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/illust1.jpg',
      },
    }),
    prisma.illustration.create({
      data: {
        title: 'Ciudad Futurista',
        description: 'Ilustración de una ciudad del futuro',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/illust2.jpg',
      },
    }),
    prisma.illustration.create({
      data: {
        title: 'Retrato Onírico',
        description: 'Ilustración de retrato surrealista',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/illust3.jpg',
      },
    }),
    prisma.illustration.create({
      data: {
        title: 'Naturaleza Viva',
        description: 'Ilustración de flora y fauna',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/illust4.jpg',
      },
    }),
    prisma.illustration.create({
      data: {
        title: 'Abstracción Geométrica',
        description: 'Ilustración abstracta con formas geométricas',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/illust5.jpg',
      },
    }),
  ]);
  console.log(`✅ ${illustrations.length} ilustraciones creadas`);

  // Crear biografía
  const biography = await prisma.biography.create({
    data: {
      content: 'Artista visual con más de 15 años de experiencia en pintura, escultura y diseño gráfico. Su obra explora la conexión entre la naturaleza y las emociones humanas, utilizando técnicas tradicionales y digitales.',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/portrait.jpg',
    },
  });
  console.log(`✅ Biografía creada`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log(`📧 Admin login: admin@test.com / admin123`);
};

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
