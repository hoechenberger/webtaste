import React, { Component } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Plot from 'react-plotly.js';
import { saveAs } from 'file-saver';
// import DownloadReportButtton from './DownloadReportButtton'

// import { confirmAlert } from 'react-confirm-alert';
// import 'react-confirm-alert/src/react-confirm-alert.css'
// import { Confirm } from 'react-confirm-bootstrap';


class TrialPlot extends Component {
  range = (start, end) => {
    return Array.from({length: (end - start)}, (v, k) => k + start);
  };

  render () {
    const data = {
      x: this.range(1, this.props.concentrations.length + 1),
      y: this.props.concentrations,
      type: 'scatter',
      mode: 'lines+markers',
      marker: {color: 'blue', size: 20},
      line: {dash: 'dash'}
    };

    const layout = {
      // width: 500,
      // height: 400,
      autosize: true,
      title: 'Experimental Procedure',
      xaxis: {title: 'Trial', zeroline: false, dtick: 1, fixedrange: true},
      yaxis: {
        title: 'Concentration in log10 mol/L', zeroline: false,
        fixedrange: true},
      margin: {l: 50, r: 50, t: 50, b: 50}
    };

    const config = {displayModeBar: false};

    return (
      <Plot data={[data]} layout={layout} config={config}
            useResizeHandler={true} className='trial-plot'/>
    );
  }
}


class DownloadReportButtton extends Component {
  _getQuestReportFromApi = async () => {
    const uri = '/api/measurements/' + this.props.measurementId + '/report';
    const response = await fetch(uri, {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: {}
    });

    return await response;
  };

  handleClickDownloadReport = () => {
    const response = this._getQuestReportFromApi();
    let filename;

    response
      .then(r => {
        const contentDispositionHeader = r.headers.get('content-disposition');
        filename = contentDispositionHeader.split('=')[1];
      });

    response
      .then(r => r.blob())
      .then(blob => saveAs(blob, filename));
  };

  render () {
    return (
        <Button color='success'
                onClick={this.handleClickDownloadReport}>Download Report
        </Button>
    );
  }
}

class ConfirmRestartModal extends Component {
  handleConfirm = () => {
    this.props.toggle();
    this.props.onConfirm();
  };

  render() {
    return (
      <span>
        {/*<Button color="danger" onClick={this.toggle}>{this.props.buttonLabel}</Button>*/}
        <Modal isOpen={this.props.show} toggle={this.props.toggle}
               className={this.props.className}>
          <ModalHeader toggle={this.props.toggle}>{this.props.header}</ModalHeader>
          <ModalBody>{this.props.body}</ModalBody>
          <ModalFooter>
            <Button color="primary"
                    onClick={this.handleConfirm}>
              {this.props.confirmButtonText}
            </Button>{' '}
            <Button color="secondary"
                    onClick={this.props.toggle}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </span>
    );
  }
}

class Measurement extends Component {
  state = {
    showConfirmRestartModal: false
  };

  handleYesResponseButton = () => this.props.onResponse(true);
  handleNoResponseButton = () => this.props.onResponse(false);

  toggleConfirmRestartModal = () => this.setState(
    {showConfirmRestartModal: !this.state.showConfirmRestartModal}
  );

  render () {
    const buttons = !this.props.finished ? (
      <div>
        <ConfirmRestartModal show={this.state.showConfirmRestartModal}
                             toggle={this.toggleConfirmRestartModal}
                             onConfirm={this.props.onRestart}
                             header='Abort Measurement'
                             body='Would you like to abort the current measurement?'
                             confirmButtonText='Abort Measurement'/>

      <strong>Please present jar {this.props.sampleNumber}. </strong><br />
        Did the participant successfully recognize this concentration?<br /><br />
        <Button color="success"
                onClick={this.handleYesResponseButton}
                disabled={this.props.finished}>Yes</Button>{' '}
        <Button color="danger"
                onClick={this.handleNoResponseButton}
                disabled={this.props.finished}>No</Button>{' '}
      </div>
    ) : (
      <div>
        <ConfirmRestartModal show={this.state.showConfirmRestartModal}
                             toggle={this.toggleConfirmRestartModal}
                             onConfirm={this.props.onRestart}
                             header='New Measurement'
                             body='Would you like to start a new measurement?'
                             confirmButtonText='New Measurement'/>

        <strong>Measurement completed.</strong><br />
        Threshold estimate: <strong>{this.props.threshold} log<sub>10</sub> mol/L</strong><br /><br />
        <DownloadReportButtton
            measurementId={this.props.measurementId}
        />{' '}
        <Button color="danger"
                onClick={this.toggleConfirmRestartModal}>New Measurement</Button>
        {/*<ConfirmRestartModal open={this.state.showConfirmRestartModal}/>*/}
      </div>
    );

    return (
      <div>
        <div>
          — Participant {this.props.metadata.participant} —<br/>
          <small>
            Substance: {this.props.metadata.substance},
            Lateralization: {this.props.metadata.lateralization},
            Session: {this.props.metadata.session}
          </small>
          <br/><br/>
        </div>
        <div>
          {}
          <div>
            {buttons}
            <br />
          </div>
          <div>
          </div>

        </div>
        <div>
          <TrialPlot concentrations={this.props.concentrations }/>
        </div>
        {!this.props.finished ?
          <div className='abort-button'>
            <Button color="danger"
                    onClick={this.toggleConfirmRestartModal}>Abort</Button>
          </div>
          : null}
      </div>
    )
  }
}

export default Measurement;
