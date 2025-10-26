import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixManagerDocuments() {
  try {
    console.log('Starting to fix manager documents...');

    // Find all documents uploaded by managers that don't have managerId set
    const documents = await prisma.documents.findMany({
      where: {
        managerId: null
      },
      include: {
        uploader: {
          select: {
            id: true,
            role: true,
            name: true
          }
        }
      }
    });

    console.log(`Found ${documents.length} documents without managerId`);

    let updated = 0;
    for (const doc of documents) {
      if (doc.uploader && (doc.uploader.role === 'manager' || doc.uploader.role === 'property_manager')) {
        await prisma.documents.update({
          where: { id: doc.id },
          data: { managerId: doc.uploadedById }
        });
        console.log(`✅ Updated document ${doc.id} (${doc.name}) - set managerId to ${doc.uploader.name}`);
        updated++;
      }
    }

    console.log(`\n✅ Successfully updated ${updated} documents`);
    console.log(`📊 Summary:`);
    console.log(`   - Total documents checked: ${documents.length}`);
    console.log(`   - Documents updated: ${updated}`);
    console.log(`   - Documents skipped (not manager): ${documents.length - updated}`);

  } catch (error) {
    console.error('❌ Error fixing manager documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixManagerDocuments();

