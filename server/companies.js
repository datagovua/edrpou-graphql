import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} from 'graphql';
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromPromisedArray,
  globalIdField,
  fromGlobalId,
  nodeDefinitions,
  cursorToOffset,
  offsetToCursor
} from 'graphql-relay';
import esSanitize from 'elasticsearch-sanitize';

import { fetchCompanyById, fetchElastic, fetchCompanies } from './fetch';


const { nodeInterface, nodeField } = nodeDefinitions(
  globalId => {
    const { type, id } = fromGlobalId(globalId);
    if (type === 'Company') {
      return fetchCompanyById(id);
    }
  },
  object => {
    if (object.hasOwnProperty('edrpou')) {
      return CompanyType;
    }
  },
);

export const CompanyType = new GraphQLObjectType({
  name: 'Company',
  description: '...',
  fields: () => ({
    id: globalIdField('Company'),
    officialName: {type: GraphQLString},
    name: {type: GraphQLString},
    address: {type: GraphQLString},
    edrpou: {type: GraphQLInt},
    mainPerson: {type: GraphQLString},
    occupation: {type: GraphQLString},
    status: {type: GraphQLString}
  }),
  interfaces: [ nodeInterface ]
});

var {connectionType: CompanyConnection} =
  connectionDefinitions({nodeType: CompanyType});

const SearchResultCompanies = new GraphQLObjectType({
  name: 'SearchResultCompanies',
  fields: () => ({
    results: { type: new GraphQLList(CompanyType) },
    count: { type: GraphQLInt }
  })
});

export const CompaniesQuery = {
  type: CompanyConnection,
  args: Object.assign({
    searchByEdrpou: { type: GraphQLInt },
    searchByName: { type: GraphQLString },
  }, connectionArgs),
  resolve: (root, args) => {
    return fetchCompanies(args);
  }
};

export const SearchCompaniesQuery = {
  type: SearchResultCompanies,
  args: {
    fullText: { type: GraphQLString },
  },
  resolve: (root, args) => {
    if(args.fullText) {
      const query = encodeURIComponent(esSanitize(args.fullText).replace(new RegExp('\\\\ ', 'g'), " ") + "*");
      return fetchElastic(`/companies_index/_search?q=${query}&sort=_score,edrpou:asc&size=100`)
             .then(res => {
               if(!res.hits) throw new Error("Elastic search error");
               return {
                 results: res.hits.hits.map((hit) => hit._source),
                 count: res.hits.total
               };
             });
    } else {
      throw new Error("No search query provided");
    }
  }
};

//export nodeField;
