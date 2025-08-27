import "../bootstrap";

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin",
    schema: "public",
  },
  dialect: process.env.DB_DIALECT || "postgres",
  timezone: "-03:00",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: process.env.DB_DEBUG === "true" 
    ? (msg) => console.log(`[Sequelize] ${new Date().toISOString()}: ${msg}`) 
    : false,
  dialectOptions: process.env.DB_HOST?.includes('supabase') ? {
    ssl: {
      require: true,
      rejectUnauthorized: false // Para Supabase
    },
    prependSearchPath: true,
    searchPath: "public"
  } : {
    prependSearchPath: true,
    searchPath: "public"
  },
  pool: {
    max: 10, // Reducir para conexión pooled
    min: 1,
    acquire: 60000, // Aumentar timeout para red
    idle: 10000,
    evict: 1000 * 60 * 5,
  },
  retry: {
    max: 5, // Más reintentos para conexión remota
    timeout: 60000,
    match: [
      /Deadlock/i,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeConnectionTimedOutError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionAcquireTimeoutError/,
      /Operation timeout/,
      /ETIMEDOUT/,
      /ECONNREFUSED/,
      /ENOTFOUND/
    ]
  },
};
