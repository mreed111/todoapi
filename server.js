var express = require('express');

var app = express();
var PORT = process.env.PORT || 3000;

var todos = [{
    id: 1,
    description: 'eat lunch',
    completed: false
}, {
    id: 2,
    description: 'swim',
    completed: false
},{
    id: 3,
    description: 'nap',
    completed: true
}];

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

app.listen(PORT, function () {
    console.log('Express listening on port ' + PORT + '!');
});
