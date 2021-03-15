/* eslint react/jsx-props-no-spreading: off */
import React from 'react';
import { Switch, Route } from 'react-router-dom';
// import HomePage from './containers/HomePage';
import { Layout } from './containers/Layout';
import { UI_Routes } from './lib/routes';
import { Repositories, Repository } from './components';

// Lazily load routes and code split with webpacck
const LazyCounterPage = React.lazy(() =>
  import(/* webpackChunkName: "CounterPage" */ './components/counter/CounterPage')
);

const CounterPage = (props: Record<string, any>) => (
  <React.Suspense fallback={<h1>Loading...</h1>}>
    <LazyCounterPage {...props} />
  </React.Suspense>
);

export default function Routes() {
  return (
    <Layout>
      <Switch>
        <Route path={UI_Routes.COUNTER} component={CounterPage} />
        <Route exact path={UI_Routes.ROOT} component={Repositories} />
        <Route exact path={UI_Routes.REPOSITORY} component={Repository} />
      </Switch>
    </Layout>
  );
}
