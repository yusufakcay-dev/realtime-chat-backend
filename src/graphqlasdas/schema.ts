import gql from "graphql-tag";
import { GraphQLContext, Message } from "../types/typing";

export const typeDefs = gql`
  type Message {
    userId: String!
    username: String!
    userImg: String
    text: String!
    timestamp: String!
  }

  type Query {
    messages(limit: Int = 100): [Message!]!
  }

  type Mutation {
    sendMessage(
      userId: String!
      username: String!
      userImg: String
      text: String!
      timestamp: String!
    ): Message!
  }

  type Subscription {
    messageSent: Message!
  }
`;

export const resolvers = {
  Query: {
    messages: async (
      _: Event,
      { limit }: { limit: number },
      { prisma }: GraphQLContext
    ) => {
      return prisma.message.findMany({
        orderBy: { timestamp: "asc" },
        take: limit,
      });
    },
  },

  Mutation: {
    sendMessage: async (_: Event, args: Message, context: GraphQLContext) => {
      const { prisma, pubsub } = context;
      const message = await prisma.message.create({ data: args });
      await pubsub.publish("MESSAGE_SENT", { messageSent: message });
      return message;
    },
  },

  Subscription: {
    messageSent: {
      subscribe: (_: Event, __: Event, { pubsub }: GraphQLContext) =>
        pubsub.asyncIterator(["MESSAGE_SENT"]),
    },
  },
};
