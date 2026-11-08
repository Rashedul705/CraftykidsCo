import { connectToDatabase } from '../src/lib/mongodb';
import { Product } from '../src/models/Product';
import { Bundle } from '../src/models/Bundle';
import { GiftCategory } from '../src/models/GiftCategory';
import { GiftItem } from '../src/models/GiftItem';
import { Order } from '../src/models/Order';

export async function cleanupDemoData() {
  await connectToDatabase();
  console.log('--- Cleaning up all DEMO data ---');
  const pRes = await Product.deleteMany({ titleEn: { $regex: /^DEMO/i } });
  const bRes = await Bundle.deleteMany({ titleEn: { $regex: /^DEMO/i } });
  const cRes = await GiftCategory.deleteMany({ name: { $regex: /^DEMO/i } });
  const gRes = await GiftItem.deleteMany({ name: { $regex: /^DEMO/i } });
  const oRes = await Order.deleteMany({ customerName: { $regex: /^DEMO/i } });

  console.log(`Removed:
  - ${pRes.deletedCount} DEMO Products
  - ${bRes.deletedCount} DEMO Bundles
  - ${cRes.deletedCount} DEMO Gift Categories
  - ${gRes.deletedCount} DEMO Gift Items
  - ${oRes.deletedCount} DEMO Orders`);
  console.log('✅ Cleanup complete!');
}

if (process.argv[1]?.endsWith('cleanup-demo-data.ts')) {
  cleanupDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error cleaning demo data:', err);
      process.exit(1);
    });
}

