import React  from 'react';
import { Button, Card, CardHeader, CardBody } from 'reactstrap';
import { useHistory } from 'react-router-dom'
import navTargets from "./Navigation";


const Landing = (props) => {
  let history = useHistory();

  const loggedIn = props.loggedIn;
  const userName = props.userName;
  const onLogout = props.onLogout;

  if (!loggedIn) {
    const target = navTargets.login;
    history.push(target);
  }

  return(
    <div>
      <Card className="landing-card">
        <CardHeader>Hello, {userName}!</CardHeader>
        <CardBody>
          <NewMeasurementButton />
          <MeasurementsOverviewButton />
          <AccountSettingsButton />
          <LogoutButton onLogout={onLogout}/>
        </CardBody>
      </Card>
    </div>
  )
};

const NewMeasurementButton = () => {
  let history = useHistory();
  const target = navTargets.newMeasurement;

  return (
    <Button color="success" size="lg" block
            onClick={() => history.push(target)}>
      New Measurement
    </Button>
  )
};

const MeasurementsOverviewButton = () => {
  let history = useHistory();
  const target = navTargets.masurementsOverview;

  return (
    <Button color="primary" size="lg" block
            onClick={() => history.push(target)}>
      Completed Measurements
    </Button>
  )
};

const AccountSettingsButton = () => {
  let history = useHistory();
  const target = navTargets.account;

  return (
    <Button color="warning" size="lg" block
            onClick={() => history.push(target)}>
      Account Settings
    </Button>
  )
};

const LogoutButton = (props) => {
  let history = useHistory();
  const target = navTargets.login;

  const onClick = async () => {
    await props.onLogout();
    history.push(target);
  };

  return (
    <Button color="danger" size="lg" block
            onClick={onClick}>
      Logout
    </Button>
  )
};


export default Landing;
