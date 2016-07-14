import h from 'snabbdom/h';

import { createLinkHandler } from '../utils';

const ItemsContainer = ({ list, history }) => {
  return (
    <div class="container">
      <h2>This is the items page!</h2>
      <ul>
        {list.map(({ id, text }) => (
          <li>
            <a attrs-href={`/items/${id}`}
              on-click={createLinkHandler(history)}>
              {text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
};

export default ItemsContainer;
