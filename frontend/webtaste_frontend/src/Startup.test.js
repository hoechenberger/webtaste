import React from 'react';
import ReactDOM from 'react-dom';
import Startup from './Startup';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Startup />, div);
  ReactDOM.unmountComponentAtNode(div);
});
