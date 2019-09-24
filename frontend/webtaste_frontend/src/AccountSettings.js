import React, { Component } from 'react';
import { Button, Card, CardBody, CardHeader, FormGroup, FormText, Input } from "reactstrap";
import { withRouter } from 'react-router-dom'


class AccountSettings extends Component {
  state = {
    userName: '',
    email: ''
  };

  componentDidMount = async () => {
    await this.fetchUserSettings();
  };

  handleUserNameChange = (e) => {
    this.setState({userName: e.target.value});
  };

  handleEmailChange = (e) => {
    this.setState({email: e.target.value});
  };

  fetchUserSettings = async () => {
    const uri = '/api/user/settings';
    const response = await fetch(uri, {method: 'get'});
    const json = await response.json();

    if (response.ok) {
      this.setState({
        userName: json.data.name,
        email: json.data.email
      })
    } else {
      console.log('Could not retrieve user settings!')
    }
  };

  navigateToLanding = () => {
    this.props.history.push('/landing')
  };

  render = () => {
      if (!this.props.loggedIn) {
        return null
      }

      return(
        <div>
          <Card className="account-settings-card">
            <CardHeader>Account Settings</CardHeader>
            <CardBody>
              <FormGroup>
                <FormText>User name</FormText>
                <Input type="text"
                       name="user-name"
                       id="user-name"
                       value={this.state.userName}
                       onChange={this.handleUserNameChange}
                       disabled={true}/>
              </FormGroup>
              <FormGroup>
                <FormText>Email address</FormText>
                <Input type="text"
                       name="user-email"
                       id="user-email"
                       value={this.state.email}
                       onChange={this.handleEmailChange}
                       disabled={true} />
              </FormGroup>
              <Button color="primary" size="lg"  onClick={this.navigateToLanding}>Back</Button>
            </CardBody>
          </Card>
        </div>
      );
  }
}

export default withRouter(AccountSettings);
