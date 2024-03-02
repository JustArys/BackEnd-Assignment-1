const nodemailer = require("nodemailer");


const html = `
<h1>Hello World</h1>
<p>this is text that will be sent to your email</p>
`;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.SECRET_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function main() {

    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"Fred Foo 👻" <abiev.arystanbek@gmailcom>', // sender address
        to: "220341@astanait.edu.kz, 220341@astanait.edu.kz", // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello world?", // plain text body
        html: html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Message url: %s", nodemailer.getTestMessageUrl(info))
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}

main().catch(console.error);