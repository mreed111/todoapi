var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

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
    var query = request.query;
    var where = {};

    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        where.completed = true;
    } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        where.completed = false;
    }
    if (query.hasOwnProperty('q') && query.q.length > 0) {
        where.description = {
            $like: '%' + query.q + '%'
        };
    }

    db.todo.findAll({where: where}).then(function(todos) {
        response.json(todos);
    }, function (e) {
        response.status(500).send();
    });
});

//GET /todos/:id
app.get('/todos/:id', function(request, response) {
    var todoID = parseInt(request.params.id, 10);

    db.todo.findById(todoID).then(function(todo) {
        if (!!todo) {
            response.json(todo.toJSON());
        } else {
            console.log('No todo with ID: ' + request.params.id + ' found!');
            response.status(404).send();
        }
    }, function (e) {
        response.status(500).json(e);
    });
});

// POST /todos
app.post('/todos', function(request, response) {
    var body = _.pick(request.body, 'description', 'completed');

    db.todo.create(body).then(function (todo) {
        response.json(todo.toJSON());
    }, function (e) {
        response.status(400).json(e);
    });
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

db.sequelize.sync({
                    //force: true
}).then(function () {
    app.listen(PORT, function () {
        console.log('Express listening on port ' + PORT + '!');
    });
});
