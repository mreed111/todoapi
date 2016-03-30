var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var bcrypt = require('bcryptjs');

var middleware = require('./middleware.js')(db);

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

//GET /todos?completed=false&q=xx
app.get('/todos', middleware.requireAuthentication, function(request, response) {
    var query = request.query;
    var where = { 
        userId: request.user.get('id')
    };

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

    db.todo.findAll({
        where: where
    }).then(function(todos) {
        response.json(todos);
    }, function (e) {
        response.status(500).send();
    });
});

//GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function(request, response) {
    var todoID = parseInt(request.params.id, 10);
    var where = { 
        id: todoID,
        userId: request.user.get('id')
    };
    db.todo.findOne({
        where: where
    }).then(function(todo) {
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
app.post('/todos', middleware.requireAuthentication, function(request, response) {
    var body = _.pick(request.body, 'description', 'completed');

    db.todo.create(body).then(function (todo) {
        // request.user is set in the requireAuthentication function in middleware.js
        request.user.addTodo(todo).then(function () {
            // the .addTodo() function above modified the todo that was created
            // the .reload() function passes the updated todo to the next item
            // in the chain.
            return todo.reload();
        }).then(function (todo) {
            response.json(todo.toJSON());
        });
    }, function (e) {
        response.status(400).json(e);
    });
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function (request, response) {
    var todoID = parseInt(request.params.id, 10);
    var where = { 
        id: todoID,
        userId: request.user.get('id')
    };

    db.todo.destroy({ 
        where: where 
    }).then(function(rowsDeleted) { // success function
        if (rowsDeleted === 0) {
            response.status(404).json({
                error: 'No todo with ID: ' + request.params.id
            });
        } else {
            // status(204) indicates success + no return value...
            response.status(204).send()
        }
    }, function () { // error function
        //
        response.status(500).send();
    });
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function (request, response) {
    var todoID = parseInt(request.params.id, 10);
    var body = _.pick(request.body, 'description', 'completed');
    var where = { 
        id: todoID,
        userId: request.user.get('id')
    };
    var updatedTodoAttributes = {};

    //console.log('body.completed = "' + body.completed + '"')
    //updatedTodo.completed = true;

    if (body.hasOwnProperty('completed')) {
        updatedTodoAttributes.completed = body.completed;
    }
    if (body.hasOwnProperty('description')) {
        updatedTodoAttributes.description = body.description;
    }

    //console.log('todoID: ' + request.params.id);
    //console.log(updatedTodoAttributes);

    db.todo.findOne({
        where: where
    }).then(function (todo) {
        if (todo) { // success:  todo ID found.  Update and return it.
            //
            //console.log(updatedTodoAttributes);
            todo.update(updatedTodoAttributes).then(function(todo) { // success callback
                // this function receives the updated todo item
                //console.log(todo);
                response.json(todo.toJSON());
            }, function(e) { // error: todoID was found, but update failed.
                response.status(400).json(e);
            });
        } else { // error:  specified todo ID not found.
            response.status(404).send();
        }   
    }, function () { //error: findById failed.  specified todoID not found.
        response.status(500).send();
    });
});

// POST /users
app.post('/users', function(request, response) {
    var body = _.pick(request.body, 'email', 'password');

    db.user.create(body).then(function (user) {
        response.json(user.toPublicJSON());
    }, function (e) {
        response.status(400).json(e);
    });
});


// POST /users/login
app.post('/users/login', function(request, response) {
    //
    var body = _.pick(request.body, 'email', 'password');

    db.user.authenticate(body).then(function (user) {
        //
        var token = user.generateToken('authentication');
        if (token) {
            response.header('Auth', token).json(user.toPublicJSON());
        } else {
            response.status(401).send();
        }
    }, function () {
        //
        response.status(401).send();
    });
});


db.sequelize.sync({
                   // force: true
}).then(function () {
    app.listen(PORT, function () {
        console.log('Express listening on port ' + PORT + '!');
    });
});
