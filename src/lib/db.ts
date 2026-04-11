import { prisma } from './prisma';

/**
 * Execute a raw SQL query using Prisma
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function query(queryString: string, params: any[] = []): Promise<any> {
  try {
    // Use Prisma's $queryRaw for raw SQL queries
    const result = await prisma.$queryRaw(queryString, ...params);
    return { rows: result };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a raw SQL query that doesn't return rows (INSERT, UPDATE, DELETE)
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result with rowCount
 */
export async function execute(queryString: string, params: any[] = []): Promise<any> {
  try {
    const result = await prisma.$executeRaw(queryString, ...params);
    return { rowCount: result };
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
}

export default { query, execute };