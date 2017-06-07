import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} from 'graphql';
import csv from 'csv';
import fs from 'fs';

import { CompanyType } from './companies';
import { fetchCompanies } from './fetch';


const TreasuryOrganization = new GraphQLObjectType({
  name: 'TreasuryOrganization',
  fields: () => ({
    treasuryType: { type: GraphQLString },
    edrFields: { type: CompanyType },
    parentOrganization: { type: CompanyType },
    childOrganizations: { type: new GraphQLList(TreasuryOrganization) }
  })
})

const TreasuryType = new GraphQLObjectType({
  name: 'Treasury',
  description: 'Data related to Treasury of Ukraine',
  fields: () => ({
    organization: { type: TreasuryOrganization },
  }),
});

let treasuryTree = {};

function readTreasuryFile() {
  const p = new Promise((resolve, reject) => {
    const data = fs.readFileSync('server/treasury.csv');
    csv.parse(data, {columns: true}, (err, records) => {
      if (err) reject(err);
      resolve(records);
    });
  });
  return p;
}


function listToTree(data, options) {
    options = options || {};
    var ID_KEY = options.idKey || 'id';
    var PARENT_KEY = options.parentKey || 'parent';
    var CHILDREN_KEY = options.childrenKey || 'children';

    var tree = [],
        childrenOf = {};
    var item, id, parentId;

    for (var i = 0, length = data.length; i < length; i++) {
        item = data[i];
        id = item[ID_KEY];
        parentId = item[PARENT_KEY] || 0;
        // every item may have children
        childrenOf[id] = childrenOf[id] || [];
        // init its children
        item[CHILDREN_KEY] = childrenOf[id];
        if (parentId != 0) {
//console.log(item)
            // init its parent's children object
            childrenOf[parentId] = childrenOf[parentId] || [];
            // push it into its parent's children object
            childrenOf[parentId].push(item);
        } else {
            tree.push(item);
        }
    };

    return tree;
}

function fillEdrFields(organizations) {
  organizations.forEach((org) => {
    org.edrFields = { officialName: org.name, edrpou: org.code }
    if(org.childOrganizations.length > 0 ) { fillEdrFields(org.childOrganizations) };
  })
}

let tree = null;

function getTreasuryChildren() {
  return readTreasuryFile().then((records) => {
    tree = listToTree(records, {idKey: 'code', parentKey: 'parent_code', childrenKey: 'childOrganizations'});
    fillEdrFields(tree[0].childOrganizations);
    return tree[0].childOrganizations;//[{ edrFields: { officialName: 'AA' } }];
  });
}

export const TreasuryQuery = {
  type: TreasuryType,
  resolve: (root, args) => {
    return Promise.all([fetchCompanies({searchByEdrpou: '37567646'}), fetchCompanies({searchByEdrpou: '00013480'})]).then(([ dksu, minfin ]) => {
      return {
        organization: {
          treasuryType: 'Апарат Державної казначейської служби України',
          edrFields: dksu.edges[0].node,
          parentOrganization: minfin.edges[0].node,
          childOrganizations: getTreasuryChildren()
        },
      };
    });
  }
};
