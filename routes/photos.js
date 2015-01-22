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
            var contactId = req.query.CONTACT_ID;
            if (!contactId) 		
            {
                res.status(403).send( {"type": "MissingParameter", "message": "Missing CONTACT_ID in query string."} ); 
            }
            
            var getRawBody = require('raw-body');
            var typer      = require('media-typer');                    
            
            getRawBody(req, {
                length: req.headers['content-length'],
                limit: '1mb',
                encoding: typer.parse(req.headers['content-type']).parameters.charset
              }, function (err, rawBody) {
                    if (err)
                        return res.status(403).send( {"type": "ContentError", "message": "Provide content to upload."} ).end();                  

                    var cont = req.config.azure.containerName;               
                    var azure = require('azure-storage');

                    var blobService = azure.createBlobService(req.config.azure.storageAccount,
                        req.config.azure.storageAccessKey);

                    blobService.createContainerIfNotExists(cont, function(error, result, response){
                        if (!error) 
                        {
                            // get file extension based on content-type sent to server
                            var mime = require('mime');
                            var fileExt = mime.extension(req.headers['content-type']);

                            var stream = require('stream');
                            var s = new stream.Readable();
                            s._read = function noop() {}; // redundant? see update below
                            s.push(rawBody);

                            blobService.createBlockBlobFromStream(cont, contactId + "." + fileExt, s, rawBody.length, function(error) {
                                if (error) {
                                    res.status(403).send( {"type": "BlobError", "message": "Can't upload provided content to storage."} );                  
                                }
                                else
                                {
                                    res.send(201);
                                }
                                
                                s.push(null);
                            });
                        }
                        else
                        {
                            res.status(403).send( {"type": "BlobContainerError", "message": "Can't open container."} );                  
                        }
                    });        
              });                                
    	}
    	else
    	{
    		res.status(401).send( {"type": "Unauthorized", "message": "The request requires user authentication."} );	         
    	}
    });    	
});

module.exports = router;