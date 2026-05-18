import { prisma } from '../../db/client'

// Fetch all system settings
export async function getSettings() {
  return prisma.systemSetting.findMany()
}

// Fetch a single setting value by its key
export async function getSettingByKey(key: string): Promise<string | null> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key }
  })
  return setting ? setting.value : null
}

// Upsert a setting key-value pair
export async function updateSetting(key: string, value: string) {
  return prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value }
  })
}
