import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';

import { CompaniesQuery, SearchCompaniesQuery } from './companies';

const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Реєстр юридичних осіб України',

  fields: () => ({
//    node: nodeField, // not used?
    companies: CompaniesQuery,
    searchCompanies: SearchCompaniesQuery
  })
});

export default new GraphQLSchema({
  query: QueryType
});
