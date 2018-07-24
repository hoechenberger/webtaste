import React from 'react';
import ReactDOM from 'react-dom';
import { TrialPlot, DownloadReportButtton,
  ConfirmRestartModal, Measurement } from './Measurement';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<TrialPlot />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<DownloadReportButtton />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<ConfirmRestartModal />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Measurement />, div);
  ReactDOM.unmountComponentAtNode(div);
});
