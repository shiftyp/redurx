import { createState } from 'redurx';

import { selectItem } from '../actions';

const state = createState();

state('list', [{
  id: "1",
  text: 'This is item 1'
},{
  id: "2",
  text: 'This is item 2'
}]);

state('selected', null)
  .reduce([selectItem, state('list')], (selected, [id, list]) => {
    return list.find(item => item.id === id) || null;
  });

state.connect();

export default state;
