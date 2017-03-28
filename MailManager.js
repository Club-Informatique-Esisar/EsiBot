let email 	= require("emailjs");
let server 	= email.server.connect({
   user:     "postmaster@mg.esisariens.org",
   password: "12d7c3d398f9751cb6ba22859fe28b43",
   host:     "smtp.mailgun.org",
   ssl:      true
});

module.exports = function() {
    return server;
};