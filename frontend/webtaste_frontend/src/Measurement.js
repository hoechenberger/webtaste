import React, { Component } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Plot from 'react-plotly.js';
import { saveAs } from 'file-saver';
import { withRouter } from 'react-router-dom'


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
      xaxis: {
        title: 'Trial',
        zeroline: false,
        dtick: 1,
        fixedrange: true},
      yaxis: {
        title: this.props.ylabel,
        zeroline: false,
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
    const uri = `/api/studies/${this.props.studyId}` +
                `/measurements/${this.props.measurementId}/report`;

    const response = await fetch(uri, {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
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


class SniffinStick extends Component {
  handleClick = () => {
    this.props.onClick(this.props.index);
  };

  render () {
    return (
        <Button color={this.props.color}
                className="btn-circle"
                onClick={this.handleClick}
                disabled={this.props.disabled}>
          {this.props.sampleNumber}
        </Button>
    );
  }
}

class Measurement extends Component {
  state = {
    measurementId: null,
    measurementState: null,
    trialsCompletedCount: 0,
    concentrations: [],
    sampleNumber: null,
    stimulusOrder: null,
    correctResponseIndex: null,
    threshold: null,
    thresholdSampleNumber: null,
    showConfirmRestartModal: false,
    responseButtonsEnabled: false
  };

  componentDidMount = () => {
    if (!this.props.loggedIn) {
      this.props.history.push('/');
      return
    } else if (Object.keys(this.props.metadata).length === 0) {
      this.props.history.push('/startup');
      return
    }

    this.startMeasurement(this.props.studyId, this.props.metadata);
  };

  componentDidUpdate = () => {
    if (!this.props.loggedIn) {
      this.props.history.push('/');
      return
    } else if (Object.keys(this.props.metadata).length === 0) {
      this.props.history.push('/startup');
      return
    }
  };

  handleYesResponseButton = () => {
    this.setState({responseButtonsEnabled: false},
        async () => {
          await this.submitGustatoryParticipantResponse(true);
          this.setState({responseButtonsEnabled: true});
        })
  };

  handleNoResponseButton = () => {
    this.setState({responseButtonsEnabled: false},
        async () => {
          await this.submitGustatoryParticipantResponse(false);
          this.setState({responseButtonsEnabled: true});
        })
  };

  handleSniffinStickResponse = (penIndex) => {
    this.setState({responseButtonsEnabled: false},
        async () => {
          await this.submitOlfactoryParticipantResponse(penIndex);
          this.setState({responseButtonsEnabled: true});
        })
  };

  startMeasurement = async (studyId, metadata) => {
    const uri = `/api/studies/${this.props.studyId}` +
                `/measurements/`;
    const response = await fetch(uri, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata),
      credentials: 'same-origin'
    });

    const r = await response.json();

    this.setState({
      measurementId: r.data.number,
      measurementState: r.data.state,
      trialsCompletedCount: 0,
      currentTrialNumber: null,
      threshold: null,
      thresholdSampleNumber: null
    });

    await this.createNewTrial();
    this.setState({responseButtonsEnabled: true});
  };

  createNewTrial = async () => {
    const uri = `/api/studies/${this.props.studyId}` +
                 `/measurements/${this.state.measurementId}` +
                 `/trials/`;
    const response = await fetch(uri, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: {},
      credentials: 'same-origin'
    });

    if (response.status === 201) {
      const json = await response.json();
      this.setState(prevState => ({
        sampleNumber: json.data.sampleNumber,
        stimulusOrder: json.data.stimulusOrder,
        correctResponseIndex: json.data.correctResponseIndex,
        // https://stackoverflow.com/a/37002941/1944216
        concentrations: [...prevState.concentrations, json.data.concentration],
        currentTrialNumber: json.data.trialNumber,
        measurementState: 'running'
      }));
      return true
    } else {
      return false
    }
  };

  getThreshold = async () => {
    const uri = `/api/studies/${this.props.studyId}` +
                `/measurements/${this.state.measurementId}`;
    const response = await fetch(uri, {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    });

    const json = await response.json();
    const data = {
      threshold: json.data.threshold,
      thresholdSampleNumber: json.data.thresholdSampleNumber
    };

    return data;
  };

  submitGustatoryParticipantResponse = async (participantResponse) => {
    const uri = `/api/studies/${this.props.studyId}` +
                `/measurements/${this.state.measurementId}` +
                `/trials/${this.state.currentTrialNumber}`;

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
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });

    const newTrial = await this.createNewTrial();
    if (!newTrial) {
      const thresholdData = await this.getThreshold();
      this.setState({
        measurementState: 'finished',
        threshold: thresholdData.threshold,
        thresholdSampleNumber: thresholdData.thresholdSampleNumber
      })
    }
  };

  submitOlfactoryParticipantResponse = async (penIndex, ) => {
    const uri = `/api/studies/${this.props.studyId}` +
                `/measurements/${this.state.measurementId}` +
                `/trials/${this.state.currentTrialNumber}`;

    const responseCorrect = penIndex === this.state.correctResponseIndex;

    const payload = {
      response: String(penIndex),
      responseCorrect: responseCorrect,
    };

    await fetch(uri, {
      method: 'put',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });

    const newTrial = await this.createNewTrial();
    if (!newTrial) {
      const thresholdData = await this.getThreshold();
      this.setState({
        measurementState: 'finished',
        threshold: thresholdData.threshold,
        thresholdSampleNumber: thresholdData.thresholdSampleNumber
      })
    }
  };


  _deleteMeasurement = async () => {
    const uri = `/api/studies/${this.props.studyId}` +
                `/measurements/${this.state.measurementId}`;

    await fetch(uri, {
      method: 'delete',
      credentials: 'same-origin'
    })
  };

  _abortMeasurement = async () => {
    const uri = `/api/studies/${this.props.studyId}` +
                `/measurements/${this.state.measurementId}`;
    const payload = JSON.stringify({state: 'aborted'});

    await fetch(uri, {
      method: 'put',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: payload,
      credentials: 'same-origin'
    })
  };

  abortMeasurement = async () => {
    // await this._deleteMeasurement();
    await this._abortMeasurement();
    this.props.onRestart();
  };

  toggleConfirmRestartModal = () => this.setState(
    {showConfirmRestartModal: !this.state.showConfirmRestartModal}
  );

  renderGustatoryButtons = () => {
    const buttons = (this.state.measurementState !== 'finished') ? (
        <div>
          <ConfirmRestartModal show={this.state.showConfirmRestartModal}
                               toggle={this.toggleConfirmRestartModal}
                               onConfirm={this.abortMeasurement}
                               header='Abort Measurement'
                               body='Would you like to abort the current measurement? TheData will still be saved.'
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
          Threshold estimate: <strong>{this.state.threshold.toFixed(1)} {this.getThresholdUnit()}</strong><br /><br />
          <DownloadReportButton
              studyId={this.props.studyId}
              measurementId={this.state.measurementId}
          />{' '}
          <Button color="danger"
                  onClick={this.toggleConfirmRestartModal}>New Measurement</Button>
          {/*<ConfirmRestartModal open={this.state.showConfirmRestartModal}/>*/}
        </div>
    );

    return buttons;
  };

  _genOlfactoryButtons = () => {
    const stimulusOrder = this.state.stimulusOrder;

    const buttons = stimulusOrder.map((stim, idx) => {
      let color;

      if (stim === "red") {
        color = "danger";
      } else if (stim === "green") {
        color = "success";
      } else if (stim === "blue") {
        color = "primary"
      }
      return (
          <span key={idx}>
            <SniffinStick
              onClick={this.handleSniffinStickResponse}
              color={color}
              sampleNumber={this.state.sampleNumber}
              index={idx}
              disabled={!this.state.responseButtonsEnabled}
            />{' '}
          </span>
      );
    });

    return buttons;
  };

  getThresholdUnit = () => {
    if (this.props.metadata.modality === "gustatory") {
      return <span>log<sub>10</sub> mol/L</span>
    } else {
      return <span>log<sub>10</sub> %</span>
    }
  };

  renderOlfactoryButtons = () => {
    const buttons = (this.state.measurementState !== 'finished') ? (
        <div>
          <ConfirmRestartModal show={this.state.showConfirmRestartModal}
                               toggle={this.toggleConfirmRestartModal}
                               onConfirm={this.abortMeasurement}
                               header='Abort Measurement'
                               body='Would you like to abort the current measurement? TheData will still be saved.'
                               confirmButtonText='Abort Measurement'/>
          <strong>Please present triade number {this.state.sampleNumber} in the displayed order. </strong><br />
          Which Sniffin' Stick did the participant identify?<br /><br />

          {this.state.stimulusOrder ? this._genOlfactoryButtons() : null}
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
          Threshold estimate: <strong>Stick {this.state.thresholdSampleNumber.toFixed(2)} ({this.state.threshold.toFixed(3)} {this.getThresholdUnit()})</strong><br /><br />
          <DownloadReportButton
              studyId={this.props.studyId}
              measurementId={this.state.measurementId}
          />{' '}
          <Button color="danger"
                  onClick={this.toggleConfirmRestartModal}>New Measurement</Button>
          {/*<ConfirmRestartModal open={this.state.showConfirmRestartModal}/>*/}
        </div>
    );

    return buttons;
  };



  render () {
      if (!this.props.loggedIn ||
          (Object.keys(this.props.metadata).length === 0)) {
        return null
      }

    let buttons;

    if (this.props.metadata.modality === "gustatory") {
      buttons = this.renderGustatoryButtons()
    } else {
      buttons = this.renderOlfactoryButtons();
    }

    return (
      <div className="measurement">
        <div>
          — Participant {this.props.metadata.participant} —<br/>
          <small>
            Substance: {this.props.metadata.substance},
            Lateralization: {this.props.metadata.lateralization},
            Session: {this.props.metadata.sessionName}
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
          {this.props.metadata.modality === "gustatory" ? (
              <TrialPlot
                  concentrations={this.state.concentrations}
                  ylabel='Concentration in log10 g/100 mL'
              />
          ) : (
              <TrialPlot
                  concentrations={this.state.concentrations}
                  ylabel='Concentration in log10 %'
              />)}
        </div>
        {this.state.measurementState !== 'finished' ?
          <div className='abort-button'>
            <Button color="danger"
                    onClick={this.toggleConfirmRestartModal}>Abort</Button>
          </div>
          : null}
      </div>
    )
  }
}

export default withRouter(Measurement);
