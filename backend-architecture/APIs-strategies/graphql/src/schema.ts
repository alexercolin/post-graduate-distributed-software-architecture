import { buildSchema } from "graphql";

export const schema = buildSchema(/* GraphQL */ `
  type Task {
    id: Int!
    title: String!
    done: Boolean!
  }

  type Query {
    tasks: [Task!]!
  }

  type Mutation {
    createTask(title: String!): Task!
  }
`);
