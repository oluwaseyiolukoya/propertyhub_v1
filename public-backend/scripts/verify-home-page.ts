/**
 * Script to verify and publish the home page
 *
 * This script checks if the home page exists and is published in the database.
 * If it's not published, it will publish it.
 *
 * Usage:
 *   npx tsx scripts/verify-home-page.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyHomePage() {
  try {
    console.log('🔍 Checking home page status...\n');

    // Find the home page
    const homePage = await prisma.landing_pages.findUnique({
      where: { slug: 'home' },
    });

    if (!homePage) {
      console.log('❌ Home page not found in database!');
      console.log('\n📝 You need to create the home page first in the public admin.');
      console.log('   Go to: https://contrezz.com/public-admin/landing-pages');
      return;
    }

    console.log('✅ Home page found:');
    console.log(`   ID: ${homePage.id}`);
    console.log(`   Slug: ${homePage.slug}`);
    console.log(`   Title: ${homePage.title}`);
    console.log(`   Published: ${homePage.published ? '✅ YES' : '❌ NO'}`);
    console.log(`   Published At: ${homePage.publishedAt || 'Never'}`);
    console.log(`   Has Content: ${homePage.content ? '✅ YES' : '❌ NO'}`);
    console.log(`   Last Updated: ${homePage.updatedAt}`);

    if (homePage.content && typeof homePage.content === 'object') {
      const content = homePage.content as any;
      console.log(`\n📄 Content Preview:`);
      console.log(`   Hero Headline: ${content.hero?.headline || 'N/A'}`);
      console.log(`   Stats Count: ${content.stats?.length || 0}`);
      console.log(`   Features Count: ${content.features?.length || 0}`);
      console.log(`   Testimonials Count: ${content.testimonials?.length || 0}`);
    }

    // If not published, offer to publish it
    if (!homePage.published) {
      console.log('\n⚠️  Home page is NOT published!');
      console.log('   This means it won\'t appear on the public landing page.');
      console.log('\n🔧 Publishing home page now...');

      const updated = await prisma.landing_pages.update({
        where: { id: homePage.id },
        data: {
          published: true,
          publishedAt: new Date(),
        },
      });

      console.log('✅ Home page has been published!');
      console.log(`   Published At: ${updated.publishedAt}`);
    } else {
      console.log('\n✅ Home page is already published and ready to use!');
    }

    console.log('\n🌐 Public URL: https://contrezz.com/');
    console.log('🔧 Admin URL: https://contrezz.com/public-admin/landing-pages/home');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyHomePage();

