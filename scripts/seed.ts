#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../src/services/encryptionService';
import { ServiceType, KeyTier, KeyStatus } from '../src/models/types';
import { Logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function seed() {
  try {
    Logger.info('Starting database seeding...');

    // Create demo user
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@apikey-wallet.com' },
      update: {},
      create: {
        id: 'demo-user-001',
        email: 'demo@apikey-wallet.com',
        name: 'Demo User',
        role: 'USER',
        subscription: 'FREE',
        isActive: true
      }
    });

    Logger.info('Created demo user:', demoUser.email);

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@apikey-wallet.com' },
      update: {},
      create: {
        id: 'admin-user-001',
        email: 'admin@apikey-wallet.com',
        name: 'Admin User',
        role: 'ADMIN',
        subscription: 'PREMIUM',
        isActive: true
      }
    });

    Logger.info('Created admin user:', adminUser.email);

    // Create sample service configurations
    const serviceConfigs = [
      {
        name: 'openweather',
        type: ServiceType.WEATHER,
        baseUrl: 'https://api.openweathermap.org',
        authType: 'query',
        authParam: 'appid',
        rateLimits: { rpm: 1000, rph: 10000, rpd: 100000 },
        supportedTiers: [KeyTier.FREE, KeyTier.PAID, KeyTier.PREMIUM],
        pricing: { free: 0, paid: 0.001, premium: 0.0005 }
      },
      {
        name: 'stripe',
        type: ServiceType.PAYMENT,
        baseUrl: 'https://api.stripe.com',
        authType: 'bearer',
        authParam: 'Authorization',
        rateLimits: { rpm: 100, rph: 1000, rpd: 10000 },
        supportedTiers: [KeyTier.PAID, KeyTier.PREMIUM],
        pricing: { free: 0, paid: 0.005, premium: 0.003 }
      },
      {
        name: 'googlemaps',
        type: ServiceType.MAPPING,
        baseUrl: 'https://maps.googleapis.com',
        authType: 'query',
        authParam: 'key',
        rateLimits: { rpm: 500, rph: 5000, rpd: 50000 },
        supportedTiers: [KeyTier.FREE, KeyTier.PAID, KeyTier.PREMIUM],
        pricing: { free: 0, paid: 0.002, premium: 0.001 }
      },
      {
        name: 'openai',
        type: ServiceType.AI,
        baseUrl: 'https://api.openai.com',
        authType: 'bearer',
        authParam: 'Authorization',
        rateLimits: { rpm: 20, rph: 200, rpd: 2000 },
        supportedTiers: [KeyTier.PAID, KeyTier.PREMIUM],
        pricing: { free: 0, paid: 0.02, premium: 0.015 }
      }
    ];

    for (const config of serviceConfigs) {
      await prisma.serviceConfig.upsert({
        where: { name: config.name },
        update: config,
        create: config
      });
      Logger.info(`Created service config: ${config.name}`);
    }

    // Create sample API keys for demo user
    const sampleKeys = [
      {
        key: 'ow_12345678901234567890123456789012',
        service: 'openweather',
        type: ServiceType.WEATHER,
        tier: KeyTier.FREE
      },
      {
        key: 'sk_test_1234567890123456789012345678',
        service: 'stripe',
        type: ServiceType.PAYMENT,
        tier: KeyTier.PAID
      }
    ];

    for (const keyData of sampleKeys) {
      const keyHash = EncryptionService.createKeyHash(keyData.key);
      const encryptedKey = EncryptionService.encrypt(keyData.key);

      await prisma.apiKey.upsert({
        where: { keyHash },
        update: {},
        create: {
          userId: demoUser.id,
          keyHash,
          encryptedKey,
          serviceName: keyData.service,
          serviceType: keyData.type,
          tier: keyData.tier,
          status: KeyStatus.ACTIVE,
          quota: keyData.tier === KeyTier.FREE ? 1000 : 10000,
          quotaUsed: 0,
          quotaPeriod: 'monthly',
          lastUsed: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });
      Logger.info(`Created sample API key for ${keyData.service}`);
    }

    Logger.info('Database seeding completed successfully!');
  } catch (error) {
    Logger.error('Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seed };
