var express = require('express');
var router = express.Router();

/* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Express' });
//});

router.get('/users/:id', function(req, res){
	console.log (req.params);   
	res.send(req.params.id, 200);	
	//res.render('index', {
	//	title: 'node.js hello'
	//});
	//console.log(req.query);

	var Firebase = require('firebase');
	var dataRef = new Firebase('https://gnbk61xrhx7.firebaseio-demo.com/');	
	dataRef.push({name: "user", id: req.params.id});

	dataRef.on('child_added', function(snapshot) {
        var message = snapshot.val();
        displayChatMessage(message.name, message.id);
    });    
});

function displayChatMessage(name, text) {
	console.log('added to db: ' + text);        
};      


/*
router.get('/users/:id', function(req, res){
	console.log(req.params);   
	res.send(req.params.id, 200);	
	//res.render('index', {
	//	title: 'node.js hello'
	//});
	//console.log(req.query);

});
*/

module.exports = router;
