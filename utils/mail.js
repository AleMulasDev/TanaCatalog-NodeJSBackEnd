const sgMail = require("@sendgrid/mail");
const constant = require("./constant");
const api =  require("./_api_keys");
const SENDGRID_API_KEY = api.SENDGRID_API_KEY;

function encodeQueryData(data) {
  const ret = [];
  for (let d in data)
    ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
  return ret.join('&');
}

function _confirmMail(to, token, redirect) {
  let link = constant.MAIL_VERIFY_PATH + '?' + (redirect ? encodeQueryData({token: token, redirect: redirect}) : encodeQueryData({token: token}));
  console.log(link);
  return new Promise((resolve, reject) => {
    sgMail.setApiKey(SENDGRID_API_KEY);
    const msg = {
      to: to,
      from: constant.FROM_EMAIL_ADDRESS,
      subject: "Verifica email",
      text: `Per verificare la tua email premi sul seguente link:\n\
      ${link}`,
      html: `Per verificare la tua email premi sul seguente link:<br>\
      <a href="${link}">Verifica</a>\
      `
    };
    sgMail
      .send(msg)
      .then(() => {
        resolve();
      })
      .catch(error => {
        console.error(error.toString());
        const { message, code, response } = error;
        const { headers, body } = response;
        reject(response);
      });
  });
}

function _recoverPassword(to, token, redirect) {
  let link = constant.MAIL_RECOVER_PATH + '?' + (redirect ? encodeQueryData({token: token, redirect: redirect}) : encodeQueryData({token: token}));
  return new Promise((resolve, reject) => {
    sgMail.setApiKey(SENDGRID_API_KEY);
    const msg = {
      to: to,
      from: constant.FROM_EMAIL_ADDRESS,
      subject: "Cambio password",
      text: `Per recuperare la password premi al seguente link:\n\
      ${link}`,
      html: `Per recuperare la password premi al seguente link:<br>\
      <a href="${link}">Verifica</a>\
      oppure se il link non funziona copia e incolla il seguente link nella barra di ricerca:<br>\
      ${link}
      `
    };
    sgMail
      .send(msg)
      .then(() => {
        resolve();
      })
      .catch(error => {
        console.error(error.toString());
        const { message, code, response } = error;
        const { headers, body } = response;
        reject(response);
      });
  });
}

function _sendNewPassword(to, password, redirect){
  let footer = redirect ? `<a href="${redirect}">Premi qua per loggare</a>` : '';
  return new Promise((resolve, reject) => {
    sgMail.setApiKey(SENDGRID_API_KEY);
    const msg = {
      to: to,
      from: constant.FROM_EMAIL_ADDRESS,
      subject: "Aggiornamento sulla password",
      text: `Di recente è stata fatta richiesta di recupero password;\n\
      Ecco la tua nuova password: ${password}\n\
      Ti suggeriamo di cambiarla al più presto con una più sicura\n` + footer,
      html: `Di recente è stata fatta richiesta di recupero password;<br>\
      Ecco la tua nuova password: ${password}<br>\
      Ti suggeriamo di cambiarla al più presto con una più sicura<br>` + footer
    };
    sgMail
      .send(msg)
      .then(() => {
        resolve();
      })
      .catch(error => {
        console.error(error.toString());
        const { message, code, response } = error;
        const { headers, body } = response;
        reject(response);
      });
  });
}

let mail = {
  confirmMail : _confirmMail,
  recoverPassword: _recoverPassword,
  sendNewPassword: _sendNewPassword
}
module.exports = mail;
