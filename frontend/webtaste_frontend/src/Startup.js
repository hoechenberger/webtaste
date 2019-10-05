import React, { Component } from 'react';
import { Button, Card, CardBody, CardHeader, Collapse, Form, FormGroup, Input, Label } from 'reactstrap';
import { withRouter } from 'react-router-dom'
import Tooltip from './Tooltip'
import { AlgorithmInput } from "./AlgorithmInputForm";
import { SubstanceInput } from "./SubstanceInputForm";
import { LateralizationInput } from "./LateralizationInputForm";


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
    sessionName: "",
    studies: [],
    studyName: "",
    newStudyName: "",
    date: ""
  };

  componentDidMount = async () => {
    if (!this.props.loggedIn) {
      this.navigateToLogin();
    } else {
      await this.restoreStateFromLocalStorage();
      this.getStudiesFromApi();

      // Must be empty in case the user created a new study in the previous run,
      // otherwise we will try to create a new study on each startup.
      if (this.state.newStudyName !== "") {
        this.setState({
          studyName: "",
          newStudyName: ""
        });
      }
    }
  };

  // componentDidUpdate = () => {
  //   if (!this.props.loggedIn) {
  //     this.props.history.push('/')
  //   }
  // };

  navigateToLanding = () => {
    this.props.history.push('/landing')
  };

  navigateToLogin = () => {
    this.props.history.push('/')
  };

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

  getStudiesFromApi = async () => {
    const uri = '/api/studies/';
    const response = await fetch(uri, {
      method: 'get',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    });

    const json = await response.json();
    this.setState({studies: json.data.studies});
  };

  createNewStudy = async () => {
    const uri = '/api/studies/';
    const payload = {name: this.state.newStudyName};

    const response = await fetch(uri, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      credentials: 'same-origin'
    });

    const json = await response.json();
    return json.data.id;
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    let studyId;

    // Create a new study if the selected study does not exist already;
    // otherwise, recover the Study ID from the array of studies we have
    // populated earlier.
    if (this.state.newStudyName) {
      studyId = await this.createNewStudy();
    } else {
      let study = this.state.studies.filter(
          (study) => study.name === this.state.studyName
      );
      studyId = study[0].id;
    }

    let metadata = {
      participant: this.state.participant,
      age: this.state.age,
      gender: this.state.gender,
      modality: this.state.modality,
      algorithm: this.state.algorithm,
      substance: this.state.substance,
      lateralization: this.state.lateralization,
      sessionName: this.state.sessionName,
      studyName: this.state.newStudyName ?
          this.state.newStudyName : this.state.studyName,
      // Don't forget to add the current date & time :-)
      date: new Date().toUTCString()
    };

    if (this.state.startVal) {
      metadata.startVal = this.state.startVal;
    }

    this.saveStateToLocalStorage();
    this.props.onSubmit(studyId, metadata);
    this.props.history.push('/measurement')
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
    this.setState({
      algorithm: e.target.value,
      startVal: ""
    });
  };

  handleSubstanceChange = (e) => {
    this.setState({substance: e.target.value});
  };

  handleLateralizationChange = (e) => {
    this.setState({lateralization: e.target.value});
  };

  handleSessionChange = (e) => {
    this.setState({sessionName: e.target.value});
  };

  handleStudyChange = (e) => {
    this.setState({
      studyName: e.target.value,
      newStudyName: ""
    })
  };

  handleNewStudyChange = (e) => {
    this.setState({newStudyName: e.target.value});
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
      <div className="measurement-info">
        <Form method="post"
              onSubmit={this.handleSubmit}
              className="measurement-info-form">
          <Card className="study-info-card">
            <CardHeader onClick={this.toggleParticipantInfoCard}>
              Study Info
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label for="study" className="input-label-required">
                  Study name
                </Label>
                <Tooltip text="The name of the study this measurement belongs to."
                         id="tooltip-study"/>

                <Input type="select" name="study" id="study"
                       value={this.state.studyName}
                       onChange={this.handleStudyChange}
                       required>
                  <option value="" hidden>– select –</option>
                  <option value="_new">Create new …</option>
                  {this.state.studies.map(
                      (study, index) => <option key={index}>{study.name}</option>
                  )}
                </Input>
              </FormGroup>

              {this.state.studyName === "_new"
                  ? (<FormGroup>
                    <Label for="study-new" className="input-label-required">
                      Create new study
                    </Label>
                    <Input name="study-new" id="study-new"
                           placeholder="e.g. NIH Grant 123"
                           value={this.state.newStudyName}
                           onChange={this.handleNewStudyChange}
                           required/>
                  </FormGroup>)
                  : null
              }
            </CardBody>
          </Card>
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
                  <Label for="lateralization" className="input-label-required">
                    Lateralization
                  </Label>
                  <Tooltip text={"Whether to test on both sides (bilateral testing) or on only " +
                                 "one side (unilateral testing)."}
                           id="tooltip-lateralization"/>
                  <LateralizationInput
                    value={this.state.lateralization}
                    onChange={this.handleLateralizationChange}
                  />
                </FormGroup>
                {(this.state.modality === "olfactory") && (this.state.algorithm === 'Hummel') ? (
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
                         value={this.state.sessionName}
                         onChange={this.handleSessionChange}
                         required />
                </FormGroup>

              </CardBody>
            </Collapse>
          </Card>
          <div className="measurement-info-form-buttons">
            <Button color="primary" size="lg" className="back-button" onClick={this.navigateToLanding}>Back</Button>
            <Button color='success' size="lg" className="start-button" type="submit">Start</Button>
          </div>
        </Form>
      </div>
    );
  }
}

export default withRouter(Startup);
