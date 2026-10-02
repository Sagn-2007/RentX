import { PrismaClient } from '@prisma/client';
import { generatePassportHash } from '../utils/hash';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Passport Migration...");

  const items = await prisma.item.findMany({
    where: { passport_hash: null },
    include: { bookings: { orderBy: { created_at: 'asc' } } }
  });

  console.log(`Found ${items.length} items to migrate.`);

  for (const item of items) {
    const passport_hash = generatePassportHash({
      id: item.id,
      owner_id: item.owner_id,
      created_at: item.created_at,
      serial_number: item.serial_number
    });

    await prisma.$transaction(async (tx) => {
      // 1. Update the Item
      await tx.item.update({
        where: { id: item.id },
        data: { passport_hash }
      });

      // 2. Synthesize ITEM_LISTED
      await tx.itemHistoryEvent.create({
        data: {
          item_id: item.id,
          actor_id: item.owner_id,
          event_type: 'ITEM_LISTED',
          condition_snapshot: item.condition_checklist || undefined,
          created_at: item.created_at,
          metadata: { source: "phase2_migration", reconstructed: true }
        }
      });

      // 3. Reconstruct Booking Events
      for (const booking of item.bookings) {
        // Request event
        await tx.itemHistoryEvent.create({
          data: {
            item_id: item.id,
            booking_id: booking.id,
            actor_id: booking.renter_id,
            event_type: 'RENTAL_REQUESTED',
            created_at: booking.created_at,
            metadata: { source: "phase2_migration", reconstructed: true }
          }
        });

        // Accept event
        if (['accepted', 'active', 'returned'].includes(booking.status)) {
          // Approximate timestamp
          const acceptedTime = new Date(booking.created_at.getTime() + 1000); 
          await tx.itemHistoryEvent.create({
            data: {
              item_id: item.id,
              booking_id: booking.id,
              actor_id: item.owner_id,
              event_type: 'RENTAL_ACCEPTED',
              created_at: acceptedTime,
              metadata: { source: "phase2_migration", reconstructed: true }
            }
          });
        }

        // Return event
        if (booking.status === 'returned') {
          // Use booking updated_at for return time
          await tx.itemHistoryEvent.create({
            data: {
              item_id: item.id,
              booking_id: booking.id,
              actor_id: booking.renter_id, // approximation for migration
              event_type: 'RENTAL_RETURNED',
              created_at: booking.updated_at,
              metadata: { source: "phase2_migration", reconstructed: true }
            }
          });
        }
      }
    });

    console.log(`Migrated Item ${item.id} - Hash: ${passport_hash}`);
  }

  console.log("Migration Complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
