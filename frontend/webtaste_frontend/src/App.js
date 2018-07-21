import React, { Component } from 'react';
import Startup from './Startup'
import Measurement from './Measurement'
// import './App.css';



class App extends Component {
  initialState = {
    measurementStarted: false,
    measurementFinished: false,
    measurementId: null,
    metadata: {
      participant: null,
      age: null,
      gender: null,
      modality: null,
      algorithm: null,
      substance: null,
      lateralization: null,
      startVal: null,
      session: null,
      date: null
    },
    currentTrialNumber: null,
    trialsCompletedCount: null,
    concentration: null,
    concentrations: [],
    sampleNumber: null,
    threshold: null,
    date: null
  };

  state = this.initialState;

  resetState = () => this.setState(this.initialState);

  // componentDidMount() {
  //   const foo = x('foo', 'citric acid', 'left', 'Retest');
  //   foo.then(f => console.log(f));
  //   // this.startMeasurement();
  // };

  onMeasurementStarted = () => this.setState({measurementStarted: true});
  onMeasurementFinished = () => this.setState({measurementFinished: true});

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
      metadata: r.data.metadata
    });

    this.createNewTrial();
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
        concentration: json.data.concentration,
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

  renderMeasurement = () =>
  {
    return (
      <div>
        <Measurement trial={this.state.currentTrialNumber}
                     measurementId={this.state.measurementId}
                     concentration={this.state.concentration}
                     concentrations={this.state.concentrations}
                     sampleNumber={this.state.sampleNumber}
                     threshold={this.state.threshold}
                     finished={this.state.measurementFinished}
                     metadata={this.state.metadata}
                     onResponse={this.submitParticipantResponse}
                     onRestart={this.resetState}/>
      </div>
    );
  };

  renderMainView = () => {
    if (!this.state.measurementStarted) {
      return (
          <div className="measurement-info">
            <Startup startMeasurement={this.startMeasurement}
                     dateSetter={this.setDate}/>
          </div>
      )
    } else {
      return <div className="measurement">{this.renderMeasurement()}</div>
    }
  };


  render() {
    return (
      <div className="app">
        <h2>Threshold Estimation</h2>
        {this.renderMainView()}
      </div>
    );
  }
}

export default App;
