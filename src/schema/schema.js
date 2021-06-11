/* eslint-disable no-use-before-define */
import * as graphql from 'graphql';
import RootQuery from './query';
import Mutation from './mutation';

const { GraphQLSchema } = graphql;

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
