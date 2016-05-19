import {
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLString,
  GraphQLInputObjectType,
} from '../type/index.js';

function listOf(type) {
  return new GraphQLList(type);
}

function nonNull(type) {
  return new GraphQLNonNull(type);
}

const nodeType = new GraphQLInterfaceType({
  name:'Node',
  resolveType: () => null,
  fields: ()=>({
    id: {type: GraphQLString},
    best: {type: dogType},
  }),
});

const dogType = new GraphQLObjectType({
  name:'Dog',
  fields:() => ({
    id: {type: GraphQLString},
    best: {type: dogType},
    look: {type: catType},
  }),
  interfaces: [ nodeType ],
});

const mouseType = new GraphQLObjectType({
  name:'Mouse',
  fields:() => ({
    id: {type: GraphQLString},
    best: {type: dogType},
    find: {type: cowType},
  }),
  interfaces: [ nodeType ],
});

const catType = new GraphQLObjectType({
  name:'Cat',
  fields:() => ({
    id: {type: GraphQLString},
    best: {type: dogType},
    eat: {type: mouseType},
  }),
  interfaces: [ nodeType ],
});

const cowType = new GraphQLObjectType({
  name:'Cow',
  fields:() => ({
    id: {type: GraphQLString},
    best: {type: dogType},
    feed: {type: listOf(nodeType)},
  }),
  interfaces: [ nodeType ],
});

const Root = new GraphQLObjectType({
  name: 'Root',
  fields: {
    dog: { type: dogType },
    mouse: { type: mouseType },
  },
});

export var schema = new GraphQLSchema({ query: Root });