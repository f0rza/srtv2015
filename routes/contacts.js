var express = require('express');
var router = express.Router();

router.post('/', function(req, res) {
    
    // because I can't get working correctly passport-http-bearer, made manual processing here    
    var token = "";
    if (req.headers['authorization'])
    {    	
    	token = req.headers['authorization'].replace(/Bearer /, '');    	
    }   
    
    req.fnGetByToken(token, function(userId){    		
    	if (userId > 0)
    	{    			
    		// we got user id. now can save to firebase. 
    		// Use guid as contactId node name to allow user have many contacts

    		var uuid = require('node-uuid');
    		var contactId = uuid.v1();

    		var Firebase = require('firebase');
			var dataRef = new Firebase(req.config.firebase.url);	

			var contactsRef = dataRef.child("contactsForUser_" + userId + "/" + contactId);
			contactsRef.set(req.body);
				
			dataRef.on('child_added', function(snapshot) {			        
			    res.status(201).end();
			});       			    			    			
    	}
    	else
    	{
    		res.status(401).send( {"type": "Unauthorized", "message": "The request requires user authentication."} );	         
    	}
    });    	
});

module.exports = router;