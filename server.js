var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();
var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;

/*
the body-parser npm is express.js middleware.  This command
will parse inputs as json and make them accessible via 
request.body
*/
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.send('Todo API Root');
});

//GET /todos
app.get('/todos', function(request, response) {
    response.json(todos);
});

//GET /todos/:id
app.get('/todos/:id', function(request, response) {
    var todoID = parseInt(request.params.id);
    var matchedTodo = _.findWhere(todos, {id: todoID});
    
    if (matchedTodo) {
        response.json(matchedTodo);
    } else {
        response.status(404).send();
    }
});

// POST /todos
app.post('/todos', function(request, response) {
    var body = _.pick(request.body, 'description', 'completed');
    
    if (!_.isBoolean(body.completed) || 
        !_.isString(body.description) || 
        body.description.trim().length === 0) 
    {
        return response.status(400).send();
    }
    body.description = body.description.trim();
    
    // add id field to data body
    body.id = todoNextId++;
    
    // push body into array
    todos.push(body);
    
    //console.log('description: ' + body.description);
    
    response.json(body);
});

app.listen(PORT, function () {
    console.log('Express listening on port ' + PORT + '!');
});
