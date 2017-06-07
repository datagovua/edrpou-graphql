import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';

import { CompaniesQuery, SearchCompaniesQuery } from './companies';
import { TreasuryQuery } from './treasury';

const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Реєстр юридичних осіб України',

  fields: () => ({
//    node: nodeField, // not used?
    companies: CompaniesQuery,
    searchCompanies: SearchCompaniesQuery,
    treasury: TreasuryQuery
  })
});

export default new GraphQLSchema({
  query: QueryType
});
