import prisma from './prisma';

// Fetch a shop by its ID
export async function getShopById(id: string) {
  if (!id) return null;
  return await prisma.shop.findUnique({
    where: { id },
    select: {
      id: true,
      shopName: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      email: true,
      phone: true,
      username: true,
      profileComplete: true,
      shopType: true,
      businessLicense: true,
      insurancePolicy: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      // Note: latitude/longitude are not part of Shop schema; frontend will geocode address when needed
    },
  });
}
