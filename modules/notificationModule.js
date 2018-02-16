'use strict'
const nodemailer = require('nodemailer'); //email
const Nexmo = require('nexmo'); //sms

/****** EMAIL ********/
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'remora.alerts@gmail.com',
        pass: '@imaginexyz@'
    }
});

exports.sendEmail = function (to, subject, text) {

    let mailOptions = {
        from: 'remora.alerts@gmail.com',
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log('err email', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


/****** SMS ********/

const nexmo = new Nexmo({
    apiKey: 'f1e781cb',
    apiSecret: 'a8a8f4fa9b7a7170'
});

exports.sendSms = function (to, from, text) {

    to.forEach(number => {

        nexmo.message.sendSms(from, number, text, (error, response) => {
            if (error) {
                throw error;
            } else if (response.messages[0].status != '0') {
                console.error(response);
            } else {
                console.log('Msm send');
            }
        });
    });


}

