import React, { Component } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Plot from 'react-plotly.js';
import { saveAs } from 'file-saver';


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


class DownloadReportButton extends Component {
  _getQuestReportFromApi = async () => {
    const uri = '/api/measurements/' + this.props.measurementId + '/report';
    const response = await fetch(uri, {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      }
    });

    return response;
  };

  handleClick = async () => {
    const response = await this._getQuestReportFromApi();

    const contentDispositionHeader = response.headers.get('content-disposition');
    const filename = contentDispositionHeader.split('=')[1];
    const blob = await response.blob();

    saveAs(blob, filename);
  };

  render () {
    return (
        <Button color='success'
                onClick={this.handleClick}>
          Download Report
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
    measurementId: null,
    measurementStarted: null,
    measurementFinished: null,
    trialsCompletedCount: 0,
    concentrations: [],
    sampleNumber: null,
    threshold: null,
    showConfirmRestartModal: false,
    responseButtonsEnabled: false
  };

  componentDidMount = () => this.startMeasurement(this.props.metadata);

  handleYesResponseButton = () => {
    this.setState({responseButtonsEnabled: false},
        async () => {
          await this.submitParticipantResponse(true);
          this.setState({responseButtonsEnabled: true});
        })
  };

  handleNoResponseButton = () => {
    this.setState({responseButtonsEnabled: false},
        async () => {
          await this.submitParticipantResponse(false);
          this.setState({responseButtonsEnabled: true});
        })
  };

  startMeasurement = async (metadata) => {
    const response = await fetch('/api/measurements/', {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    const r = await response.json();

    this.setState({
      measurementId: r.data.id,
      measurementStarted: r.data.started,
      measurementFinished: r.data.finished,
      trialsCompletedCount: 0,
      currentTrialNumber: null,
      metadata: r.data.metadata
    });

    await this.createNewTrial();
    this.setState({responseButtonsEnabled: true});
  };

  createNewTrial = async () => {
    const uri = '/api/measurements/' + this.state.measurementId + '/trials/';
    const response = await fetch(uri, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: {}
    });

    if (response.status === 201) {
      const json = await response.json();
      this.setState(prevState => ({
        sampleNumber: json.data.sampleNumber,
        // https://stackoverflow.com/a/37002941/1944216
        concentrations: [...prevState.concentrations, json.data.concentration],
        currentTrialNumber: json.data.trialNumber,
        measurementStarted: true
      }));
      return true
    } else {
      return false
    }
  };

  submitParticipantResponse = async (participantResponse) => {
    const uri = '/api/measurements/' + this.state.measurementId + '/trials/' + this.state.currentTrialNumber;

    const payload = {
      response: "",
      responseCorrect: participantResponse,
    };

    await fetch(uri, {
      method: 'put',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const newTrial = await this.createNewTrial();
    if (!newTrial) {
      this.setState({measurementFinished: true})
    }
  };


  toggleConfirmRestartModal = () => this.setState(
    {showConfirmRestartModal: !this.state.showConfirmRestartModal}
  );

  render () {
    const buttons = !this.state.measurementFinished ? (
      <div>
        <ConfirmRestartModal show={this.state.showConfirmRestartModal}
                             toggle={this.toggleConfirmRestartModal}
                             onConfirm={this.props.onRestart}
                             header='Abort Measurement'
                             body='Would you like to abort the current measurement?'
                             confirmButtonText='Abort Measurement'/>

      <strong>Please present jar {this.state.sampleNumber}. </strong><br />
        Did the participant successfully recognize this concentration?<br /><br />
        <Button color="success"
                onClick={this.handleYesResponseButton}
                disabled={!this.state.responseButtonsEnabled}>Yes</Button>{' '}
        <Button color="danger"
                onClick={this.handleNoResponseButton}
                disabled={!this.state.responseButtonsEnabled}>No</Button>{' '}
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
        Threshold estimate: <strong>{this.state.threshold} log<sub>10</sub> mol/L</strong><br /><br />
        <DownloadReportButton
            measurementId={this.state.measurementId}
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
          <TrialPlot concentrations={this.state.concentrations }/>
        </div>
        {!this.state.measurementFinished ?
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
