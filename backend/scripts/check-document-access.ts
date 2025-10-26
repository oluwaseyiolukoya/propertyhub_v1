import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocumentAccess() {
  try {
    const documentId = process.argv[2];
    const managerId = process.argv[3];

    if (!documentId || !managerId) {
      console.log('Usage: npx tsx scripts/check-document-access.ts <documentId> <managerId>');
      process.exit(1);
    }

    console.log(`\n🔍 Checking access for:`);
    console.log(`   Document ID: ${documentId}`);
    console.log(`   Manager ID: ${managerId}`);
    console.log(`\n${'='.repeat(60)}\n`);

    // Get document details
    const document = await prisma.documents.findUnique({
      where: { id: documentId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        properties: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        }
      }
    });

    if (!document) {
      console.log('❌ Document not found');
      process.exit(1);
    }

    console.log('📄 Document Details:');
    console.log(`   Name: ${document.name}`);
    console.log(`   Type: ${document.type}`);
    console.log(`   Status: ${document.status}`);
    console.log(`   Property ID: ${document.propertyId || 'N/A'}`);
    console.log(`   Property Name: ${document.properties?.name || 'N/A'}`);
    console.log(`   Uploaded By ID: ${document.uploadedById}`);
    console.log(`   Uploaded By Name: ${document.uploader?.name || 'N/A'}`);
    console.log(`   Uploaded By Role: ${document.uploader?.role || 'N/A'}`);
    console.log(`   Manager ID: ${document.managerId || 'N/A'}`);
    console.log(`   Manager Name: ${document.manager?.name || 'N/A'}`);

    // Get manager details
    const manager = await prisma.users.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        name: true,
        role: true
      }
    });

    if (!manager) {
      console.log('\n❌ Manager not found');
      process.exit(1);
    }

    console.log(`\n👤 Manager Details:`);
    console.log(`   ID: ${manager.id}`);
    console.log(`   Name: ${manager.name}`);
    console.log(`   Role: ${manager.role}`);

    // Check if manager manages the property
    if (document.propertyId) {
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId: document.propertyId,
          managerId: managerId,
          isActive: true
        }
      });

      console.log(`\n🏢 Property Management:`);
      console.log(`   Manages Property: ${assignment ? '✅ YES' : '❌ NO'}`);
      if (assignment) {
        console.log(`   Assignment ID: ${assignment.id}`);
        console.log(`   Assigned At: ${assignment.assignedAt}`);
      }
    }

    // Check access conditions
    console.log(`\n🔐 Access Check:`);
    console.log(`   Is Uploader: ${document.uploadedById === managerId ? '✅ YES' : '❌ NO'}`);
    console.log(`   Is Assigned Manager: ${document.managerId === managerId ? '✅ YES' : '❌ NO'}`);
    
    const hasAccess = document.uploadedById === managerId || document.managerId === managerId;
    console.log(`\n${hasAccess ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED'}`);

    if (!hasAccess) {
      console.log(`\n💡 To grant access, you need to:`);
      console.log(`   1. Set managerId to ${managerId} for this document, OR`);
      console.log(`   2. Have the manager create/upload the document themselves`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentAccess();

