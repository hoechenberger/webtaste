import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input,
  Card, CardBody, CardHeader, Collapse } from 'reactstrap';
import Tooltip from './Tooltip'


class AlgorithmInput extends Component {
  render() {
    let inputField;

    if (this.props.modality === "gustatory") {
      inputField = (
          <Input type="select" name="algorithm" id={this.props.id}
              // Disabled if no modality has been selected so far
                 disabled={this.props.modality === ""}
                 value={this.props.value}
                 onChange={this.props.onChange}
                 required>
            <option disabled value="" hidden>– select –</option>
            <option>QUEST</option>
          </Input>
      )
    } else {

      inputField = (
          <Input type="select" name="algorithm" id={this.props.id}
              // Disabled if no modality has been selected so far
                 disabled={this.props.modality === ""}
                 value={this.props.value}
                 onChange={this.props.onChange}
                 required>
            <option disabled value="" hidden>– select –</option>
            <option>QUEST</option>
            <option>Hummel</option>
          </Input>
      )
    }

    return inputField;
  }
}

class SubstanceInput extends Component {
  render() {
    let inputField;
    if (this.props.modality === "gustatory") {
      inputField = (
          <Input type="select" name="substance" id={this.props.id}
              // Disabled if no modality has been selected so far
                 disabled={this.props.modality === ""}
                 value={this.props.value}
                 onChange={this.props.onChange}
                 required>
            <option disabled value="" hidden>– select –</option>
            <option>sucrose</option>
            <option>citric acid</option>
            <option>sodium chloride</option>
            <option>quinine hydrochloride</option>
          </Input>
      )
    } else {
      inputField = (
          <Input type="select" name="substance" id={this.props.id}
              // Disabled if no modality has been selected so far
                 disabled={this.props.modality === ""}
                 value={this.props.value}
                 onChange={this.props.onChange}
                 required>
            <option disabled value="" hidden>– select –</option>
            <option>olfactory-1</option>
            <option>olfactory-2</option>
          </Input>
      )
    }

    return inputField;
  }
}

class Startup extends Component {
  state = {
    participantInfoCardIsOpen: true,
    experimentSettingsCardIsOpen: false,
    participant: "",
    age: "",
    gender: "",
    modality: "",
    algorithm: "",
    substance: "",
    lateralization: "",
    startVal: "",
    session: "",
    date: ""
  };

  componentDidMount = () => this.restoreStateFromLocalStorage();

  restoreStateFromLocalStorage = () => {
    // for all items in state
    for (let key in this.state) {
      // if the key exists in localStorage
      if (localStorage.hasOwnProperty(key)) {
        // get the key's value from localStorage
        let value = localStorage.getItem(key);

        // parse the localStorage string and call setState()
        try {
          value = JSON.parse(value);
          this.setState({ [key]: value });
        } catch (e) {
          // handle empty string
          this.setState({ [key]: value });
        }
      }
    }
  };

  // https://hackernoon.com/how-to-take-advantage-of-local-storage-in-your-react-projects-a895f2b2d3f2
  saveStateToLocalStorage = () => {
    // for every item in React state
    for (let key in this.state) {
      // save to localStorage
      localStorage.setItem(key, JSON.stringify(this.state[key]));
    }
  };

  handleSubmit = (e) => {
    e.preventDefault();

    let expInfo = {
      participant: this.state.participant,
      age: this.state.age,
      gender: this.state.gender,
      modality: this.state.modality,
      algorithm: this.state.algorithm,
      substance: this.state.substance,
      lateralization: this.state.lateralization,
      session: this.state.session,
      // Don't forget to add the current date & time :-)
      date: new Date().toUTCString()
    };

    if (this.state.startVal) {
      expInfo.startVal = this.state.startVal;
    }

    console.log(expInfo);
    this.saveStateToLocalStorage();
    this.props.startMeasurement(expInfo);
  };

  toggleParticipantInfoCard = () => {
    const participantInfoCardIsOpen = !this.state.participantInfoCardIsOpen;
    this.setState({participantInfoCardIsOpen: participantInfoCardIsOpen});
  };

  toggleExperimentSettingsCard = () => {
    const experimentSettingsCardIsOpen = !this.state.experimentSettingsCardIsOpen;
    this.setState({experimentSettingsCardIsOpen: experimentSettingsCardIsOpen});
  };

  handleParticipantChange = (e) => {
    this.setState({participant: e.target.value});
  };

  handleAgeChange = (e) => {
    // Convert to integer before storing.
    const age = e.target.value;

    if (age !== "") {
      this.setState({age: parseInt(age, 10)});
    } else {
      this.setState({age: age});
    }
  };

  handleGenderChange = (e) => {
    this.setState({gender: e.target.value});
  };

  handleModalityChange = (e) => {
    this.setState({
      modality: e.target.value,
      substance: "",
      algorithm: "",
      startVal: ""
    });
  };

  handleAlgorithmChange = (e) => {
    this.setState({algorithm: e.target.value});
  };

  handleSubstanceChange = (e) => {
    this.setState({substance: e.target.value});
  };

  handleLateralizationChange = (e) => {
    this.setState({lateralization: e.target.value});
  };

  handleSessionChange = (e) => {
    this.setState({session: e.target.value});
  };

  handleStartValChange = (e) => {
    const startVal = e.target.value;

    if (startVal !== "") {
      this.setState({startVal: parseInt(startVal, 10)});
    } else {
      this.setState({startVal: startVal});
    }
  };


  render () {
    return (
      <div>
        <Form onSubmit={this.handleSubmit} className='measurement-info-form'>
          <Card className="participant-info-card">
            <CardHeader onClick={this.toggleParticipantInfoCard}>
                Participant Info
            </CardHeader>
            <Collapse isOpen={this.state.participantInfoCardIsOpen}>
              <CardBody>
                <FormGroup>
                  <Label for="participant" className="input-label-required">
                    Participant ID
                  </Label>
                  <Tooltip text={"A unique, anonymous participant identifier " +
                  "that cannot be used to immediately identify a " +
                  "participant."}
                           id="tooltip-participant"/>

                  <Input name="participant" id="participant"
                         placeholder="e.g. 123"
                         value={this.state.participant}
                         onChange={this.handleParticipantChange}
                         required />
                </FormGroup>

                <FormGroup>
                  <Label for="age" className="input-label-required">
                    Age
                  </Label>
                  <Tooltip text="The participant's age, in years."
                           id="tooltip-age"/>
                  <Input type="number" name="age" id="age" min="0" max="120"
                         placeholder="Age in years"
                         value={this.state.age}
                         onChange={this.handleAgeChange}
                         required />
                </FormGroup>

                <FormGroup>
                  <Label for="gender" className="input-label-required">
                    Gender
                  </Label>
                  <Tooltip text="The participant's gender. If unknown, select 'undisclosed / other'."
                           id="tooltip-gender"/>
                  <Input type="select" name="gender" id="gender"
                         placeholder="Gender"
                         value={this.state.gender}
                         onChange={this.handleGenderChange}
                         required>
                    <option disabled value="" hidden>– select –</option>
                    <option>undisclosed / other</option>
                    <option>male</option>
                    <option>female</option>
                  </Input>
                </FormGroup>
              </CardBody>
            </Collapse>
          </Card>

          <Card className="measurement-settings-card">
            <CardHeader onClick={this.toggleExperimentSettingsCard}>
                Experiment Settings
            </CardHeader>
            <Collapse isOpen={this.state.experimentSettingsCardIsOpen}>
              <CardBody>
                <FormGroup>
                  <Label for="modality"  className="input-label-required">
                    Modality
                  </Label>
                  <Tooltip text="Which modality to test: gustatory (taste) or olfactory (smell)?"
                           id="tooltip-modality"/>
                  <Input type="select" name="modality" id="modality"
                         value={this.state.modality}
                         onChange={this.handleModalityChange}
                         required>
                    <option disabled value="" hidden>– select –</option>
                    <option>gustatory</option>
                    <option>olfactory</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for="algorithm"  className="input-label-required">
                    Algorithm
                  </Label>
                  <Tooltip text="The algorithm to use. See the documentation for details."
                           id="tooltip-algorithm"/>
                  <AlgorithmInput
                      modality={this.state.modality}
                      value={this.state.algorithm}
                      onChange={this.handleAlgorithmChange}
                      id="algorithm"
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="substance"  className="input-label-required">
                    Substance
                  </Label>
                  <Tooltip text={"Which substance to test. See the documentation for an overview " +
                                 "of required dilutions."}
                           id="tooltip-substance"/>
                  <SubstanceInput
                      modality={this.state.modality}
                      value={this.state.substance}
                      onChange={this.handleSubstanceChange}
                      id="substance"
                  />
                </FormGroup>

                <FormGroup>
                  <Label for="lateralization">Lateralization</Label>
                  <Tooltip text={"Whether to test on both sides (bilateral testing) or on only " +
                                 "one side (unilateral testing)."}
                           id="tooltip-lateralization"/>
                  <Input type="select" name="lateralization" id="lateralization"
                         value={this.state.lateralization}
                         onChange={this.handleLateralizationChange}
                         required>
                    {/*<option disabled value="" hidden>– select –</option>*/}
                    <option>both sides</option>
                    <option>left side</option>
                    <option>right side</option>
                  </Input>
                </FormGroup>
                {this.state.modality === "olfactory" ? (
                        <FormGroup>
                          <Label for="startval">
                            Starting concentration
                            <Tooltip text="The starting concentration."
                                     id="startval"/>
                          </Label>
                          <Input type="select" name="startval" id="startval"
                                 value={this.state.startVal}
                                 onChange={this.handleStartValChange}
                                 required>
                            <option disabled value="" hidden>– select –</option>
                            <option>15</option>
                            <option>16</option>
                          </Input>
                        </FormGroup>
                    ) : null
                }

                <FormGroup>
                  <Label for="session">Session</Label>
                  <Tooltip text="A name for this experimental session."
                           id="tooltip-session"/>
                  <Input name="session" id="session"
                         placeholder="e.g. Test, Retest"
                         value={this.state.session}
                         onChange={this.handleSessionChange} />
                         {/*required />*/}
                </FormGroup>
              </CardBody>
            </Collapse>
          </Card>
            <Button color='success' className="start-button" size="lg"
                    block>Start</Button>
        </Form>
      </div>
    );
  }
}

export default Startup;
