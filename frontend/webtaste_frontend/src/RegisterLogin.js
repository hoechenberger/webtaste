import React, { Component } from 'react';
import { Button, Form, Input,
  Card, CardBody, CardHeader, Collapse } from 'reactstrap';


class RegisterLogin extends Component {
  state = {
    registerUsername: "",
    registerEmail: "",
    registerPassword: "",
    loginUsername: "",
    loginPassword: "",
    loginCardIsOpen: true,
    registerCardIsOpen: false
  };

  toggleRegisterCard = () => {
    const registerCardIsOpen = !this.state.registerCardIsOpen;
    this.setState({registerCardIsOpen: registerCardIsOpen});
  };

  toggleLoginCard = () => {
    const loginCardIsOpen = !this.state.loginCardIsOpen;
    this.setState({loginCardIsOpen: loginCardIsOpen});
  };

  handleRegisterUsernameChange = (e) => {
    this.setState({registerUsername: e.target.value});
  };

  handleRegisterEmailChange = (e) => {
    this.setState({registerEmail: e.target.value});
  };

  handleRegisterPasswordChange = (e) => {
    this.setState({registerPassword: e.target.value});
  };

  handleLoginUsernameChange = (e) => {
    this.setState({loginUsername: e.target.value});
  };

  handleLoginPasswordChange = (e) => {
    this.setState({loginPassword: e.target.value});
  };

  registerUser = async (e) => {
    e.preventDefault();

    const payload = JSON.stringify({
      user: this.state.registerUsername,
      email: this.state.registerEmail,
      password: this.state.registerPassword
    });

    const uri = '/api/user/register';

    const response = await fetch(uri, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: payload
    });

    if (response.ok) {
      console.log('User registration successful.')
    } else {
      console.log('User registration failed.')
    }
  };

  loginUser = async (e) => {
    e.preventDefault();

    const payload = JSON.stringify({
      user: this.state.loginUsername,
      password: this.state.loginPassword
    });

    const uri = '/api/user/login';

    const response = await fetch(uri, {
      method: 'post',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      },
      body: payload,
      credentials: 'same-origin'
    });

    if (response.ok) {
      console.log('User login successful.');
      this.props.onLogin();
    } else {
      console.log('User login failed.')
    }

  };

  render () {
    return (
        <div>
          <Card className="login-card">
            <CardHeader onClick={this.toggleLoginCard}>
              Login
            </CardHeader>
            <Collapse isOpen={this.state.loginCardIsOpen}>
              <CardBody>
                <Form method="post"
                      onSubmit={this.loginUser}
                      className="measurement-info-form">
                  <Input name="login-username" id="login-username"
                         placeholder="User name"
                         value={this.state.loginUsername}
                         onChange={this.handleLoginUsernameChange}
                         required />

                  <Input type="password" name="login-password" id="login-password"
                         placeholder="Password"
                         value={this.state.loginPassword}
                         onChange={this.handleLoginPasswordChange}
                         required />

                  <Button color='success' className="login-button" size="lg"
                          block>Login</Button>
                </Form>
              </CardBody>
            </Collapse>
          </Card>

          <Card className="register-card">
            <CardHeader onClick={this.toggleRegisterCard}>
              Register
            </CardHeader>
            <Collapse isOpen={this.state.registerCardIsOpen}>
              <CardBody>
                <Form method="post"
                      onSubmit={this.registerUser}
                      className='measurement-info-form'>
                  <Input name="register-username" id="register-username"
                         placeholder="User name"
                         value={this.state.registerUsername}
                         onChange={this.handleRegisterUsernameChange}
                         required />

                  <Input type="email" name="register-email" id="register-email"
                         placeholder="john@doe.com"
                         value={this.state.registerEmail}
                         onChange={this.handleRegisterEmailChange}
                         required />


                  <Input type="password" name="register-password" id="register-password"
                         placeholder="Password"
                         value={this.state.registerPassword}
                         onChange={this.handleRegisterPasswordChange}
                         required />

                  <Button color='success' className="register-button" size="lg"
                          block>Register</Button>
                </Form>
              </CardBody>
            </Collapse>
          </Card>

        </div>
    )
  }
}


export default RegisterLogin;