import {
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLID,
} from '../type/index.js';

function listOf(type) {
  return new GraphQLList(type);
}

function nonNull(type) {
  return new GraphQLNonNull(type);
}

const nodeType = new GraphQLInterfaceType({
  name: 'Node',
  resolveType: () => null,
  fields: () => ({
    id: {type: nonNull(GraphQLString)},
  }),
});

const newPostInputType = new GraphQLInputObjectType({
  name: 'NewPostInput',
  fields: {
    user: { type: nonNull(GraphQLString) },
    content: { type: nonNull(GraphQLString) },
    clientMutationId: { type: nonNull(GraphQLString) },
  }
});

const newPostPayloadType = new GraphQLObjectType({
  name: 'NewPostPayload',
  fields: () => ({
    postEdge: {type: postEdgeType},
    web: {type: webType},
    clientMutationId: { type: nonNull(GraphQLString) },
  }),
});

const commentConnectionType = new GraphQLObjectType({
  name: 'CommentConnection',
  fields: () => ({
    pageInfo: {type: nonNull(pageInfoType)},
    edges: {type: listOf(commentEdgeType)},
  }),
});

const postConnectionType = new GraphQLObjectType({
  name: 'PostConnection',
  fields: () => ({
    pageInfo: {type: nonNull(pageInfoType)},
    edges: {type: listOf(postEdgeType)},
  }),
});

const pageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  fields: () => ({
    hasNextPage: {type: nonNull(GraphQLBoolean)},
    hasPreviousPage: {type: nonNull(GraphQLBoolean)},
    startCursor: {type: GraphQLString},
    endCursor: {type: GraphQLString},
  }),
});

const commentEdgeType = new GraphQLObjectType({
  name: 'CommentEdge',
  fields: () => ({
    node: {type: commentType},
    cursor: {type: nonNull(GraphQLString)},
  }),
});

const postEdgeType = new GraphQLObjectType({
  name: 'PostEdge',
  fields: () => ({
    node: {type: postType},
    cursor: {type: nonNull(GraphQLString)},
  }),
});

const postSearchType = new GraphQLObjectType({
  name: 'PostSearch',
  fields: () => ({
    postCount: {type: GraphQLInt},
    cursor: {type: postConnectionType},
  }),
});

const postType = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: {type: nonNull(GraphQLString)},
    user: {type: GraphQLString},
    content: {type: GraphQLString},
    comments: {type: commentConnectionType},
  }),
  interfaces: [ nodeType ],
});

const commentType = new GraphQLObjectType({
  name: 'Comment',
  fields: () => ({
    id: {type: nonNull(GraphQLString)},
    user: {type: GraphQLString},
    content: {type: GraphQLString},
    replyTo: {type: postType},
  }),
  interfaces: [ nodeType ],
});

const webType = new GraphQLObjectType({
  name: 'Web',
  fields: () => ({
    id: {type: nonNull(GraphQLString)},
    postSearch: {
      type: postSearchType,
      args: {
        text: {type: GraphQLString},
      },
    },
    allPosts: {
      type: postConnectionType,
    },
  }),
});

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    web: { type: webType },
    node: {
      type: nodeType,
      args: {
        id: {type: nonNull( GraphQLID)}
      },
      resolve: () => null,
    },
  },
});
const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    newPost: {
      type: newPostPayloadType,
      args: {
        input: {
          type: nonNull(newPostInputType),
        },
      },
      resolve: () => null,
    },
  }),
});

export var schema = new GraphQLSchema({
  query: queryType ,mutation:mutationType});

