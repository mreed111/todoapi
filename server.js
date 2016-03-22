var express = require('express');
var bodyParser = require('body-parser');

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
    var todoID = request.params.id;
    var matchedTodo;
    var i = 0;
    do {
        i++;
        if (String(i) === request.params.id) {
            matchedTodo = todos[i];
        }
    } while ( i <= todos.length && !matchedTodo );
    
    if (matchedTodo) {
        response.json(matchedTodo);
    } else {
        response.status(404).send();
    }
});

// POST /todos
app.post('/todos', function(request, response) {
    var body = request.body;
    
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
