import h from 'snabbdom/h';

import { createLinkHandler } from '../utils';

const AppContainer = ({ history }, children) => {
  return (
    <div class="container">
      <header>
        <h1>Welcome!</h1>
        <nav>
          <a attrs-href="/" on-click={createLinkHandler(history)}>
            Home
          </a>
          {' | '}
          <a attrs-href="/items" on-click={createLinkHandler(history)}>
            Browse Items
          </a>
        </nav>
      </header>
      <main>
        {children}
      </main>
    </div>
  )
};

export default AppContainer;
