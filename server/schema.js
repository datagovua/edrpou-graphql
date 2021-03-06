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

import fetch from 'node-fetch';
import esSanitize from 'elasticsearch-sanitize';

const API_URL = process.env.API_URL;
const ELASTIC_URL = process.env.ELASTIC_URL;
console.log(`API_URL: ${API_URL}`);
console.log(`ELASTIC_URL: ${ELASTIC_URL}`);

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

const CompanyType = new GraphQLObjectType({
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

const fetchCompanies = (args) => {
  let where = {};
  let pagination = "";
  let sort = "&sort=edrpou";
  let skip = 0;
  let first = 30;
  if(args.searchByName) {
    where.or = [{
      officialName: { contains: encodeURIComponent(args.searchByName) }
    }, {
      name: { contains: encodeURIComponent(args.searchByName) }
    }];
  }
  if(args.searchByEdrpou) {
    let edrpou = edrpouToString(args.searchByEdrpou);
    where.edrpou = encodeURIComponent(edrpou);
    sort = "";
  } else {
    where.edrpou = {"not": ""};
  }
  if(args.first) {
    pagination = `&limit=${args.first}`;
    first = args.first;
  }
  if(args.after != undefined) {
    pagination += `&skip=${cursorToOffset(args.after) + 1}`;
    skip = cursorToOffset(args.after) + 1;
  }
  if(args.before != undefined) {
    pagination += `&skip=${cursorToOffset(args.before) - first}`;
  }
  where = JSON.stringify(where);
  return fetchByUrl(`/companies?where=${where}${sort}${pagination}`)
  .then((companies) => {
    let edges = companies.map((value, index) => ({
      cursor: offsetToCursor(skip + index),
      node: value
    }));
    let pageInfo = { hasNextPage: companies.length == args.first };
    return { edges, pageInfo };
  });
};

const SearchResultCompanies = new GraphQLObjectType({
  name: 'SearchResultCompanies',
  fields: () => ({
    results: { type: new GraphQLList(CompanyType) },
    count: { type: GraphQLInt }
  })
});


const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Реєстр юридичних осіб України',

  fields: () => ({
    node: nodeField,
    companies: {
      type: CompanyConnection,
      args: Object.assign({
        searchByEdrpou: { type: GraphQLInt },
        searchByName: { type: GraphQLString },
      }, connectionArgs),
      resolve: (root, args) => {
        return fetchCompanies(args);
      }
    },
    searchCompanies: {
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
    }
  })
});

const fetchCompanyById = (id) => {
  let where = JSON.stringify({ id });
  return fetchByUrl(`/companies?where=$(where)`)
         .then(res => res[0]);
};

const fetchElastic = (url) => {
  return fetchByUrl(url, ELASTIC_URL);
}

const fetchByUrl = (url, base) => {
  const baseUrl = base || API_URL;
  console.log(`Fetching ${baseUrl}${url}`);
  return fetch(`${baseUrl}${url}`)
         .then(res => {
           try {
             return res.clone().json();
           } catch(e) {
             console.error(`Can not parse response: ${err}\n${res.text()}`);
             throw e;
           }
         });
};

const edrpouToString = (id) => {
  const pad = "00000000";
  return (pad+id).slice(-pad.length);
}

export default new GraphQLSchema({
  query: QueryType
});
