require("dotenv/config")


const config = {
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION,
    databaseUrl: process.env.DATABASE_URL,
    mail:{
        host : process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
}

module.exports = config;