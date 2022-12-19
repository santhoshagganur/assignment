const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const dateFns = require("date-fns");
const dbPath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertIntoOutput = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatusAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

//api 1
app.get("/todos/", async (request, response) => {
  let { search_q, status, priority, category } = request.query;
  let todoQuery = "";
  let data = null;
  switch (true) {
    case hasStatusAndPriority(request.query):
      todoQuery = `
      SELECT * FROM todo WHERE status= '${status}'
      AND priority= '${priority}'`;
      break;
    case hasStatusAndCategory(request.query):
      todoQuery = `
      SELECT * FROM todo WHERE status= '${status}' AND
      category= '${category}'`;
      break;
    case hasPriorityAndCategory(request.query):
      todoQuery = `
        SELECT * FROM todo WHERE priority= '${priority}' AND 
        category= '${category}'`;
      break;
    case hasPriority(request.query):
      todoQuery = `
      SELECT * FROM todo WHERE priority= '${priority}'`;
      break;
    case hasStatus(request.query):
      todoQuery = `
      SELECT * FROM todo WHERE status= '${status}'`;
      break;
    case hasCategory(request.query):
      todoQuery = `
      SELECT * FROM todo WHERE category= '${category}'`;
      break;
    case hasSearch(request.query):
      todoQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
      break;
  }
  data = await db.all(todoQuery);
  response.send(data.map((eachItem) => convertIntoOutput(eachItem)));
});

//api 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
    SELECT * FROM todo WHERE id= '${todoId}'`;
  const data = await db.get(todoQuery);
  response.send(convertIntoOutput(data));
});

//api 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = dateFns.format(new Date(date), "yyyy-MM-dd");
  const todoQuery = `
  SELECT * FROM todo WHERE due_date= '${newDate}'`;
  const data = await db.all(todoQuery);
  response.send(data);
});

//api 4
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  const todoQuery = `
    INSERT INTO todo(id, todo, priority, status, category, due_date)
    VALUES ('${id}',
    '${todo}', '${priority}', '${status}', '${category}', '${dueDate}')`;
  const data = await db.run(todoQuery);
  response.send("Todo Successfully Added");
});

//api 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { status } = todoDetails;
  let todoQuery = "";
  switch (true) {
    case todoDetails.status !== undefined:
      todoQuery = `
        UPDATE todo SET status= '${status}'`;
      await db.run(todoQuery);
      response.send("Status Updated");
      break;
    case todoDetails.priority !== undefined:
      todoQuery = `
        UPDATE todo SET priority= '${priority}'`;
      await db.run(todoQuery);
      response.send("Priority Updated");
      break;
    case todoDetails.todo !== undefined:
      todoQuery = `
        UPDATE todo SET todo= '${todo}'`;
      await db.run(todoQuery);
      response.send("Todo Updated");
      break;
    case todoDetails.category !== undefined:
      todoQuery = `
        UPDATE todo SET category= '${category}'`;
      await db.run(todoQuery);
      response.send("Category Updated");
      break;
    case todoDetails.dueDate !== undefined:
      todoQuery = `
        UPDATE todo SET due_date= '${dueDate}'`;
      await db.run(todoQuery);
      response.send("Due Date Updated");
      break;
  }
});

//api 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
    DELETE FROM todo WHERE id= '${todoId}'`;
  await db.run(todoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
