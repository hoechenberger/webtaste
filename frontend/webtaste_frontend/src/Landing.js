import React, { Component } from 'react';
import { Button, Card, CardHeader, CardBody } from 'reactstrap';
import { withRouter } from 'react-router-dom'

class Landing extends Component {
  componentDidMount = async () => {
    if (!this.props.loggedIn) {
      this.navigateToLogin();
    }
  };

  navigateToStartup = () => {
    this.props.history.push('/startup')
  };

  navigateToMeasurements = () => {
    this.props.history.push('/measurements_overview')
  };

  navigateToAccountSettings = () => {
    this.props.history.push('/account')
  };

  navigateToLogin = () => {
    this.props.history.push('/')
  };

  logout = () => {
    this.props.onLogout();
    this.props.history.push('/')
  };

  render = () => {
      return(
        <div>
          <Card className="landing-card">
            <CardHeader>Hello, {this.props.userName}!</CardHeader>
            <CardBody>
              <Button color="success" size="lg" block onClick={this.navigateToStartup}>New Measurement</Button>
              <Button color="primary" size="lg" block onClick={this.navigateToMeasurements}>Completed Measurements</Button>
              <Button color="warning" size="lg" block onClick={this.navigateToAccountSettings}>Account Settings</Button>
              <Button color="danger" size="lg" block onClick={this.logout}>Logout</Button>
            </CardBody>
          </Card>
        </div>
      );
  }
}

export default withRouter(Landing);
