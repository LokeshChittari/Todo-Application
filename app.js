const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running on http://localhost:3000");
    });
  } catch (e) {
    console.log("DB Error: " + e.message);
  }
};

initializeDBAndServer();

//TODOS List API
app.get("/todos/", async (request, response) => {
  const { status = "", priority = "", search_q = "" } = request.query;

  const todosListQuery = `
   SELECT 
    *
   FROM
    todo
   WHERE 
    status='${status}' OR
    priority='${priority}' OR 
    todo LIKE '%${search_q}%' 
   ORDER BY
    id ASC
   `;
  const todos = await db.all(todosListQuery);
  response.send(todos);
});

//TODO Details API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetailsQuery = `
   SELECT * FROM todo WHERE id=${todoId}
   `;
  const todo = await db.get(todoDetailsQuery);
  response.send(todo);
});

//TODO Create API
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { todo, priority, status } = todoDetails;
  const todoCreateQuery = `
    INSERT INTO todo (todo, priority, status)
    VALUES ('${todo}','${priority}','${status}')
    `;
  const dbResponse = await db.run(todoCreateQuery);
  response.send("Todo Successfully Added");
});

//TODO Update API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const todoUpdateQuery = `UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}' WHERE id=${todoId}`;
  const dbResponse = await db.run(todoUpdateQuery);
  if (request.body.status) {
    response.send("Status Updated");
  } else if (request.body.priority) {
    response.send("Priority updated");
  } else if (request.body.todo) {
    response.send("Todo updated");
  }
});

//TODO Delete API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDeleteQuery = `DELETE FROM todo WHERE id=${todoId}`;
  const dbResponse = await db.run(todoDeleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
