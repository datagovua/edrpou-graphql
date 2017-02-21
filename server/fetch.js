import fetch from 'node-fetch';
import {
  cursorToOffset,
  offsetToCursor
} from 'graphql-relay';

const API_URL = process.env.API_URL;
const ELASTIC_URL = process.env.ELASTIC_URL;
console.log(`API_URL: ${API_URL}`);
console.log(`ELASTIC_URL: ${ELASTIC_URL}`);


export const fetchCompanies = (args) => {
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

export const fetchCompanyById = (id) => {
  let where = JSON.stringify({ id });
  return fetchByUrl(`/companies?where=$(where)`)
         .then(res => res[0]);
};

export const fetchElastic = (url) => {
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
