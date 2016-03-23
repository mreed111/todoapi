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
    var queryParams = request.query;
    var filteredTodos = todos;
    
    // if has prop && completed === 'true'
    if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
        filteredTodos = _.where(filteredTodos, {completed: true});
    } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
        filteredTodos = _.where(filteredTodos, {completed: false});
    }
    console.log(filteredTodos);
    response.json(filteredTodos);
});

//GET /todos/:id
app.get('/todos/:id', function(request, response) {
    var todoID = parseInt(request.params.id, 10);
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

// DELETE /todos/:id
app.delete('/todos/:id', function (request, response) {
    var todoID = parseInt(request.params.id);
    var matchedTodo = _.findWhere(todos, {id: todoID});
    
    if (matchedTodo) {
        todos = _.without(todos, matchedTodo);
        response.json(matchedTodo);
    } else {
        var e = "no todo item found with id: " + request.params.id;
        response.status(404).json({"error": e});
    }
});

// PUT /todos/:id
app.put('/todos/:id', function (request, response) {
    var todoID = parseInt(request.params.id);
    var matchedTodo = _.findWhere(todos, {id: todoID});
    
    var body = _.pick(request.body, 'description', 'completed');
    var validAttributes = {};
    
    // find ...
    if (!matchedTodo) {
        var e = "no todo item found with id: " + request.params.id;
        response.status(404).json({"error": e});
    }
    
    // validate ...
    if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
        validAttributes.completed = body.completed;
    } else if (body.hasOwnProperty('completed')) {
        // Bad input 'completed' property is not boolean
        return response.status(400).send();
    }
    if (body.hasOwnProperty('description') && 
        _.isString(body.description) && 
        body.description.trim().length > 0) {
        validAttributes.description = body.description.trim();
    } else if (body.hasOwnProperty('description')) {
        // Bad input, 'description' property did not pass validation.
        return response.status(400).send();
    }
        
    // Update ...
    _.extend(matchedTodo, validAttributes);
    response.json(matchedTodo);
});

app.listen(PORT, function () {
    console.log('Express listening on port ' + PORT + '!');
});
