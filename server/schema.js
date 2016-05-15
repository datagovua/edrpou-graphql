import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} from 'graphql';

import fetch from 'node-fetch';

const BASE_URL = 'http://edr.data-gov-ua.org/api';

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  description: '...',
  fields: () => ({
    officialName: {type: GraphQLString},
    name: {type: GraphQLString},
    address: {type: GraphQLString},
    edrpou: {type: GraphQLInt},
    mainPerson: {type: GraphQLString},
    occupation: {type: GraphQLString},
    status: {type: GraphQLString}
  })
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Реєстр юридичних осіб України',

  fields: () => ({
    companies: {
      type: new GraphQLList(CompanyType),
      args: {
        searchByEdrpou: { type: GraphQLInt },
        searchByName: { type: GraphQLString },
        first: { type: GraphQLInt },
        after: { type: GraphQLInt }
      },
      resolve: (root, args) => {
        let where = {};
        let pagination = "";
        let sort = "&sort=edrpou"
        if(args.searchByName) {
          where.or = [{
            officialName: { contains: encodeURIComponent(args.searchByName) }
          }, {
            name: { contains: encodeURIComponent(args.searchByName) }
          }];
        }
        if(args.searchByEdrpou) {
          let edrpou = edrpouToString(args.searchByEdrpou);
          console.log(edrpou)
          where.edrpou = encodeURIComponent(edrpou);
          sort = "";
        }
        if(args.first != undefined && args.after != undefined) {
          pagination = `&skip=${args.after}&limit=${args.first}`;
        }
        where = JSON.stringify(where);
        return fetch(`${BASE_URL}/companies?where=${where}${sort}${pagination}`)
        .then(res => res.json());
      }
    }
  })
});

const edrpouToString = (id) => {
  const pad = "00000000";
  return (pad+id).slice(-pad.length);
}

export default new GraphQLSchema({
  query: QueryType
});
