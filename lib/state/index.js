import { createTree } from './tree';
import { createNode, publishNode } from './node';

export const createState = (initialState, passedCreateNode) => (
  publishNode(createTree({ initialState, createNode: passedCreateNode || createNode }))
);
