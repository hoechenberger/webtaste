import React, { Component } from 'react';
import { Button, Form, FormGroup, FormFeedback, Input,
  Modal, ModalBody, ModalFooter, ModalHeader,
  Card, CardBody, CardHeader, Collapse } from 'reactstrap';
import { withRouter } from 'react-router-dom'


class RegistrationSuccessfulModal extends Component {
  render() {
    return (
        <Modal isOpen={this.props.show}
               toggle={this.props.toggle}>
          <ModalHeader toggle={this.props.toggle}>
            Registration successful
          </ModalHeader>
          <ModalBody>
            <p>Your registration was successful.</p>
            <p>
              <strong>User name:</strong> {this.props.username}<br />
              <strong>Email:</strong> {this.props.email}
            </p>
            <p>
              An activation link has been sent to your email address. Please
              use it to activate your account. After activation, you may
              log in.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="primary"
                    onClick={this.props.toggle}>
                    Close
            </Button>
          </ModalFooter>
        </Modal>
    );
  }
}


class RegisterLogin extends Component {
  state = {
    registerUsername: "",
    registerEmail: "",
    registerPassword: "",
    registerPasswordRepeat: "",
    loginUsername: "",
    loginPassword: "",
    loginSuccessful: true,             // Will be reset during login
    registerPasswordsMatch: true,      // Will be reset during form validation
    registerPasswordMeetsPolicy: true, // Will be reset during form validation
    loginCardIsOpen: true,
    registerCardIsOpen: false,
    registrationSuccessful: false,
    registrationSuccessfulModalIsOpen: false,
    registerUsernameIsAvailable: true
  };

  toggleCards = () => {
    const loginCardIsOpen = !this.state.loginCardIsOpen;
    const registerCardIsOpen = !this.state.registerCardIsOpen;

    this.setState({
      loginCardIsOpen: loginCardIsOpen,
      registerCardIsOpen: registerCardIsOpen
    });
  };

  handleRegisterUsernameChange = (e) => {
    this.setState({
          registerUsername: e.target.value,
          registerUsernameIsAvailable: true
        },
        () => {
          this.checkRegisterPasswordMeetsPolicy();
          this.checkIfRegisterFormIsFilled();
        })
  };

  handleRegisterEmailChange = (e) => {
    this.setState({registerEmail: e.target.value},
        () => {
          this.checkRegisterPasswordMeetsPolicy();
          this.checkIfRegisterFormIsFilled();
        }
    );
  };

  handleRegisterPasswordChange = (e) => {
    this.setState({registerPassword: e.target.value},
        () => {
          this.checkRegisterPasswordMeetsPolicy();
          this.checkRegisterPasswordsMatch();
          this.checkIfRegisterFormIsFilled();
        }
    );
  };

  handleRegisterPasswordRepeatChange = (e) => {
    this.setState({registerPasswordRepeat: e.target.value},
        () => {
          this.checkRegisterPasswordMeetsPolicy();
          this.checkRegisterPasswordsMatch();
          this.checkIfRegisterFormIsFilled();
        }
    );
  };

  handleLoginUsernameChange = (e) => {
    this.setState({loginUsername: e.target.value});
  };

  handleLoginPasswordChange = (e) => {
    this.setState({loginPassword: e.target.value});
  };

  checkRegisterPasswordMeetsPolicy = () => {
    let registerPasswordMeetsPolicy;

    if (this.state.registerPassword &&
        this.state.registerPassword.length < 8) {
      registerPasswordMeetsPolicy = false;
    } else if (this.state.registerPassword &&
        this.state.registerUsername &&
        this.state.registerPassword.includes(this.state.registerUsername)) {
      registerPasswordMeetsPolicy = false;
    } else if (this.state.registerPassword &&
        this.state.registerEmail &&
        this.state.registerPassword.includes(this.state.registerEmail)) {
      registerPasswordMeetsPolicy = false;
    } else {
      registerPasswordMeetsPolicy = true;
    }

    this.setState({registerPasswordMeetsPolicy: registerPasswordMeetsPolicy},
        this.checkIfRegisterFormIsFilled);
  };

  checkRegisterPasswordsMatch = () => {
    let registerPasswordsMatch;

    registerPasswordsMatch = this.state.registerPassword === this.state.registerPasswordRepeat;
    this.setState({registerPasswordsMatch: registerPasswordsMatch},
        this.checkIfRegisterFormIsFilled);
  };

  checkIfRegisterFormIsFilled = () => {
    let registerFormIsFilled;

    (this.state.registerUsername.length > 0 &&
     this.state.registerUsernameIsAvailable &&
     this.state.registerEmail.length > 0 &&
     this.state.registerPasswordMeetsPolicy &&
     this.state.registerPassword &&
     this.state.registerPasswordRepeat &&
     this.state.registerPasswordsMatch)
        ? registerFormIsFilled = true
        : registerFormIsFilled = false;

    this.setState({registerFormIsFilled: registerFormIsFilled});
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
      this.setState({
        registrationSuccessful: true,
        registrationSuccessfulModalIsOpen: true
      })
    } else if (response.status === 409) {
      this.setState({
        registerUsernameIsAvailable: false,
        registrationSuccessful: false});
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
      this.setState({loginSuccessful: true});
      this.props.onLogin(this.state.loginUsername);
    } else {
      this.setState({loginSuccessful: false});
    }
  };

  toggleRegistrationSuccessfulModal = () => {
    const value = !this.state.registrationSuccessfulModalIsOpen;
    this.setState({registrationSuccessfulModalIsOpen: value});
    this.toggleCards(); // Hide the registration card, show the login card.
  };

  componentDidMount = () => {
    if (this.props.loggedIn) {
      this.props.history.push('/landing')
    }
  };

  componentDidUpdate = this.componentDidMount;

  render () {
    return (
        <div>
          <Card className="login-card">
            <CardHeader onClick={this.toggleCards}>
              Login
            </CardHeader>
            <Collapse isOpen={this.state.loginCardIsOpen}>
              <CardBody>
                <Form method="post"
                      onSubmit={this.loginUser}
                      className="measurement-info-form">
                  <FormGroup>
                    <Input name="login-username" id="login-username"
                           autoComplete="username"
                           placeholder="User name"
                           value={this.state.loginUsername}
                           onChange={this.handleLoginUsernameChange}
                           invalid={!this.state.loginSuccessful}
                           required />
                  </FormGroup>

                  <FormGroup>
                    <Input type="password" name="login-password" id="login-password"
                           autoComplete="current-password"
                           placeholder="Password"
                           value={this.state.loginPassword}
                           onChange={this.handleLoginPasswordChange}
                           invalid={!this.state.loginSuccessful}
                           required />
                    <FormFeedback>
                      Username and password do not match, or user does not exist.
                    </FormFeedback>
                  </FormGroup>

                  <Button color='success' className="login-button" size="lg"
                          block>Login</Button>
                </Form>
              </CardBody>
            </Collapse>
          </Card>

          <Card className="register-card">
            <RegistrationSuccessfulModal
                show={this.state.registrationSuccessfulModalIsOpen}
                toggle={this.toggleRegistrationSuccessfulModal}
                username={this.state.registerUsername}
                email={this.state.registerEmail}
            />
            <CardHeader onClick={this.toggleCards}>
              Register
            </CardHeader>
            <Collapse isOpen={this.state.registerCardIsOpen}>
              <CardBody>
                <Form method="post"
                      onSubmit={this.registerUser}
                      className='measurement-info-form'>
                   <FormGroup>
                     <Input name="register-username" id="register-username"
                            autoComplete="username"
                            placeholder="User name"
                            value={this.state.registerUsername}
                            onChange={this.handleRegisterUsernameChange}
                            invalid={!this.state.registerUsernameIsAvailable}
                            required />
                     <FormFeedback>
                       The selected user name is unavailable. Please choose a
                       different user name.
                     </FormFeedback>
                   </FormGroup>

                  <FormGroup>
                    <Input type="email" name="register-email" id="register-email"
                           autoComplete="email"
                           placeholder="john@doe.com"
                           value={this.state.registerEmail}
                           onChange={this.handleRegisterEmailChange}
                           required />
                  </FormGroup>

                  <FormGroup>
                    <Input type="password" name="register-password" id="register-password"
                           autoComplete="new-password"
                           placeholder="Password"
                           value={this.state.registerPassword}
                           onChange={this.handleRegisterPasswordChange}
                           invalid={!this.state.registerPasswordMeetsPolicy}
                           required />
                    <FormFeedback>
                      Password does not meet our security policy:
                      <ul>
                        <li>Minimum length: 8 characters</li>
                        <li>Must not include user name</li>
                        <li>Must not include  email address</li>
                      </ul>
                    </FormFeedback>
                  </FormGroup>

                  <FormGroup>
                    <Input type="password" name="register-password-repeat" id="register-password-repeat"
                           autoComplete="new-password"
                           placeholder="Password repeat"
                           value={this.state.registerPasswordRepeat}
                           onChange={this.handleRegisterPasswordRepeatChange}
                           invalid={!this.state.registerPasswordsMatch}
                           required />
                    <FormFeedback>Passwords do not match.</FormFeedback>
                  </FormGroup>

                  <Button color='success' className="register-button"
                          size="lg"
                          block
                          disabled={!this.state.registerFormIsFilled}>
                    Register
                  </Button>
                </Form>
              </CardBody>
            </Collapse>
          </Card>

        </div>
    )
  }
}


export default withRouter(RegisterLogin);