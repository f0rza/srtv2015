var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    var email = req.query.email;
    var password = req.query.password;

	getUser(req, email, password, function(err,data){
	        if (err) {
	            // error handling code goes here
	            console.log("ERROR : ",err);            
	        } else {            
	            if (data) 
	            {	            	            	
	            	// generate token
	            	var jwt = require('jwt-simple');

	            	var user = { "email": email, "password": password };
					
					var token = jwt.encode(user, req.config.token.salt);

	            	res.send({ "access_token": token })
	            }	
	            else
	            {	            	  
	            	// email/password not match
	            	res.status(409).send( {"type": "InvlidEmailPassword", "message": "Specified e-mail / password combination is not valid."} );	            	
	            }            
	        }    
	});            
});

function getUser(req, email, password, callback)
{
    req.db.query('SELECT id FROM Users WHERE email = ? and password = ?', [email, password], function(err, result)
    {
        if (err) 
            callback(err, null);
        else
            callback(null, result[0]);

    });
}

module.exports = router;