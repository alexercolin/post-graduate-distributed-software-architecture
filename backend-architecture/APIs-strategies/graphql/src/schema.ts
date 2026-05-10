import { buildSchema } from "graphql";

export const schema = buildSchema(/* GraphQL */ `
  type Task {
    id: Int!
    title: String!
    done: Boolean!
  }

  type Query {
    tasks: [Task!]!
    task(id: Int!): Task
  }

  type Mutation {
    createTask(title: String!): Task!
    updateTask(id: Int!, title: String!, done: Boolean!): Task
    patchTask(id: Int!, title: String, done: Boolean): Task
    deleteTask(id: Int!): Boolean!
  }
`);
