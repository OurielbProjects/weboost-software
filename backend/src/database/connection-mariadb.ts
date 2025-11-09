import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Créer le pool de connexions MariaDB
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'weboost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Fonction pour convertir les paramètres PostgreSQL ($1, $2, ...) en MySQL (?)
function convertPostgresToMySQL(sql: string, params: any[]): { sql: string; params: any[] } {
  if (!params || params.length === 0) {
    return { sql, params: [] };
  }

  // Remplacer $1, $2, etc. par ? dans l'ordre d'apparition
  let mysqlSql = sql;
  const mysqlParams: any[] = [];
  
  // Trouver tous les paramètres $1, $2, etc. dans l'ordre d'apparition dans la requête SQL
  const paramRegex = /\$(\d+)/g;
  const matches: Array<{ index: number; paramNum: number; position: number }> = [];
  
  let match;
  while ((match = paramRegex.exec(sql)) !== null) {
    const paramNum = parseInt(match[1]); // $1 -> 1, $2 -> 2, etc.
    if (paramNum >= 1 && paramNum <= params.length) {
      matches.push({
        index: match.index,
        paramNum: paramNum,
        position: paramNum - 1, // Index dans le tableau params (0-based)
      });
    }
  }
  
  // Trier par position dans la requête SQL (ordre d'apparition)
  matches.sort((a, b) => a.index - b.index);
  
  // Construire le tableau de paramètres dans l'ordre d'apparition
  for (const match of matches) {
    mysqlParams.push(params[match.position]);
  }
  
  // Remplacer les paramètres de la fin vers le début pour préserver les positions
  matches.sort((a, b) => b.index - a.index);
  for (const match of matches) {
    const paramStr = '$' + match.paramNum;
    mysqlSql = mysqlSql.substring(0, match.index) + '?' + mysqlSql.substring(match.index + paramStr.length);
  }
  
  return { sql: mysqlSql, params: mysqlParams };
}

// Wrapper pour compatibilité avec l'API PostgreSQL
export const pool = {
  query: async (sql: string, params?: any[]): Promise<any> => {
    try {
      // Convertir la syntaxe PostgreSQL en MySQL
      const { sql: mysqlSql, params: mysqlParams } = convertPostgresToMySQL(sql, params || []);
      
      // Exécuter la requête
      const [rows] = await mysqlPool.execute(mysqlSql, mysqlParams);
      
      // Convertir les résultats MySQL en format PostgreSQL
      const resultRows = Array.isArray(rows) ? rows : [rows];
      
      return {
        rows: resultRows,
        rowCount: resultRows.length,
      };
    } catch (error) {
      console.error('Database query error:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  },
  
  // Méthode pour fermer le pool
  end: async () => {
    await mysqlPool.end();
  },
  
  // Méthode pour obtenir une connexion (si nécessaire)
  getConnection: async () => {
    return await mysqlPool.getConnection();
  },
};

