var express = require('express');
var router = express.Router();

router.post('/', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

	getUser(req, email, function(err,data){
	        if (err) {
	            // error handling code goes here
	            console.log("ERROR : ",err);            
	        } else {            
	            if (!data) 
	            {
	            	// user not found add to db
	            	addUser(req, res, email, password);
	            }	
	            else
	            {	            	  
	            	// user already exists
	            	res.status(409).send( {"type": "EmailExists", "message": "Specified e-mail address is already registered."} );	            	
	            }            
	        }    
	});            
});

function getUser(req, email, callback)
{
    req.db.query('SELECT id FROM Users WHERE email = ?', [email], function(err, result)
    {
        if (err) 
            callback(err, null);
        else
            callback(null, result[0]);

    });
}

function addUser(req, res, pEmail, pPassword)
{
	var user  = { email: pEmail, password: pPassword };
	
	req.db.query('INSERT INTO Users SET ?', user, function(err, result) {
  		if (err) {
	    	// error handling code goes here
	        console.log("ERROR : ",err);            
	    } 
	    else 
	    { 
	    	res.sendStatus(201);
	    }
	});
}


module.exports = router;
