import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input } from 'reactstrap';

class Startup extends Component {
  handleSubmit = (e) => {
    e.preventDefault();

    const expInfo = {
      participant: e.target.elements['participant'].value,
      age: e.target.elements['age'].value,
      gender: e.target.elements['gender'].value,
      modality: e.target.elements['modality'].value,
      algorithm: e.target.elements['algorithm'],
      session: e.target.elements['session'].value,
      lateralization: e.target.elements['lateralization'].value,
      substance: e.target.elements['substance'].value,
      date: new Date().toUTCString()
    };

    this.props.startStaircase(expInfo);
  };

  handleModalityChange = (e) => {
    console.log(e.target.value);
  };

  render () {
    return (
      <div>
        <h3>Experimental Info</h3>
        <Form onSubmit={this.handleSubmit} className='expInfoForm'>
          <FormGroup>
            <Label for="participant">Participant ID</Label>
            <Input name="participant" id="participant" defaultValue="000"/>
          </FormGroup>
          <FormGroup>
            <Label for="age">Age</Label>
            <Input type="number" name="age" id="age" min="0" max="120"
                   defaultValue="0"/>
          </FormGroup>
          <FormGroup>
            <Label for="gender">Gender</Label>
            <Input type="select" name="gender" id="gender"
                   onChange={this.handleModalityChange}>
              <option>undisclosed / other</option>
              <option>male</option>
              <option>female</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="modality">Modality</Label>
            <Input type="select" name="modality" id="modality"
                   onChange={this.handleModalityChange}>
              <option>gustation</option>
              <option>olfaction</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="algorithm">Algorithm</Label>
            <Input type="select" name="algorithm" id="algorithm">
              <option>QUEST+</option>
              <option>QUEST</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="substance">Substance</Label>
            <Input type="select" name="substance" id="substance">
              <option>sucrose</option>
              <option>citric acid</option>
              <option>sodium chloride</option>
              <option>quinine hydrochloride</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="lateralization">Lateralization</Label>
            <Input type="select" name="lateralization" id="lateralization">
              <option>both sides</option>
              <option>left side</option>
              <option>right side</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="session">Session</Label>
            <Input name="session" id="session" defaultValue="Test"/>
          </FormGroup>
          <Button color='success' id="startButton">Start</Button>
        </Form>
      </div>
    );
  }
}

export default Startup;
