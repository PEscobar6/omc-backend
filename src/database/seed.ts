import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Lead, LeadSource } from '../leads/entities/lead.entity';
import 'dotenv/config';
import { User } from '../auth/entities/auth.entity';
import { ValidRoles } from '../auth/interfaces/valid-roles.interface';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'secret',
  database: process.env.DB_NAME ?? 'omc_db',
  entities: [User, Lead],
  synchronize: true, // Creates tables if they don't exist
});

async function seed() {
  await dataSource.initialize();
  console.log('📦 Database connected');

  const userRepo = dataSource.getRepository(User);
  const leadRepo = dataSource.getRepository(Lead);

  // ── Seed Admin User ─────────────────────────────────────────────
  const existingAdmin = await userRepo.findOne({ where: { email: 'admin@omc.com' } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    await userRepo.save(
      userRepo.create({
        name: 'Admin OMC',
        email: 'admin@omc.com',
        password: hashedPassword,
        role: ValidRoles.ADMIN,
      }),
    );
    console.log('✅ Admin user created (admin@omc.com / Admin123!)');
  } else {
    console.log('⏩ Admin user already exists, skipping');
  }

  // ── Seed Leads ──────────────────────────────────────────────────
  const leadsCount = await leadRepo.count();
  if (leadsCount > 0) {
    console.log(`⏩ ${leadsCount} leads already exist, skipping`);
  } else {
    const now = new Date();
    const daysAgo = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d;
    };

    const leads: Partial<Lead>[] = [
      {
        nombre: 'María García',
        email: 'maria.garcia@email.com',
        telefono: '+57 300 123 4567',
        fuente: LeadSource.INSTAGRAM,
        productoInteres: 'Curso de Marketing Digital',
        presupuesto: 150,
        createdAt: daysAgo(1),
      },
      {
        nombre: 'Carlos López',
        email: 'carlos.lopez@email.com',
        telefono: '+57 311 987 6543',
        fuente: LeadSource.FACEBOOK,
        productoInteres: 'Ebook de Copywriting',
        presupuesto: 29.99,
        createdAt: daysAgo(2),
      },
      {
        nombre: 'Ana Martínez',
        email: 'ana.martinez@email.com',
        fuente: LeadSource.LANDING_PAGE,
        productoInteres: 'Plantillas de Email',
        presupuesto: 49,
        createdAt: daysAgo(3),
      },
      {
        nombre: 'Pedro Rodríguez',
        email: 'pedro.rodriguez@email.com',
        telefono: '+57 315 555 1234',
        fuente: LeadSource.REFERIDO,
        productoInteres: 'Mentoría 1 a 1',
        presupuesto: 500,
        createdAt: daysAgo(4),
      },
      {
        nombre: 'Laura Sánchez',
        email: 'laura.sanchez@email.com',
        fuente: LeadSource.INSTAGRAM,
        productoInteres: 'Curso de Marketing Digital',
        presupuesto: 150,
        createdAt: daysAgo(5),
      },
      {
        nombre: 'Diego Hernández',
        email: 'diego.hernandez@email.com',
        telefono: '+57 320 444 7890',
        fuente: LeadSource.OTRO,
        productoInteres: 'Pack de Diseños para Redes',
        presupuesto: 75,
        createdAt: daysAgo(6),
      },
      {
        nombre: 'Valentina Díaz',
        email: 'valentina.diaz@email.com',
        fuente: LeadSource.FACEBOOK,
        productoInteres: 'Ebook de Copywriting',
        presupuesto: 29.99,
        createdAt: daysAgo(8),
      },
      {
        nombre: 'Andrés Torres',
        email: 'andres.torres@email.com',
        telefono: '+57 318 222 3333',
        fuente: LeadSource.LANDING_PAGE,
        productoInteres: 'Curso de Marketing Digital',
        presupuesto: 200,
        createdAt: daysAgo(10),
      },
      {
        nombre: 'Camila Ramírez',
        email: 'camila.ramirez@email.com',
        fuente: LeadSource.REFERIDO,
        productoInteres: 'Mentoría 1 a 1',
        presupuesto: 500,
        createdAt: daysAgo(12),
      },
      {
        nombre: 'Sebastián Flores',
        email: 'sebastian.flores@email.com',
        telefono: '+57 301 666 9999',
        fuente: LeadSource.INSTAGRAM,
        productoInteres: 'Pack de Diseños para Redes',
        presupuesto: 75,
        createdAt: daysAgo(15),
      },
      {
        nombre: 'Juliana Castro',
        email: 'juliana.castro@email.com',
        fuente: LeadSource.FACEBOOK,
        productoInteres: 'Plantillas de Email',
        presupuesto: 49,
        createdAt: daysAgo(20),
      },
      {
        nombre: 'Felipe Morales',
        email: 'felipe.morales@email.com',
        telefono: '+57 312 111 4444',
        fuente: LeadSource.LANDING_PAGE,
        productoInteres: 'Curso de Marketing Digital',
        presupuesto: 150,
        createdAt: daysAgo(25),
      },
    ];

    await leadRepo.save(leads.map((l) => leadRepo.create(l)));
    console.log(`✅ ${leads.length} leads created`);
  }

  await dataSource.destroy();
  console.log('\n🎉 Seed completed successfully!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});