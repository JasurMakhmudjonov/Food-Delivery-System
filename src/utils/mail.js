const nodemailer = require("nodemailer");
const config = require("../../config");


let configOptions = {
  host: config.mail.host,
  port: config.mail.port,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
};

const transporter = nodemailer.createTransport(configOptions);

async function sendMail(to, code) {
  const info = await transporter.sendMail({
    from: config.mail.user, 
    to,
    subject: "Hello ✔", 
    text: `Your confirmation code is:  ${code}`, 
    html: `<b> Your confirmation code is: ${code}</b>`, 
  });

  console.log("Message sent: %s,", info.messageId);
}

module.exports = sendMail;
