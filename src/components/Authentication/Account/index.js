import React, { Component } from 'react';
import { compose } from 'recompose';

import {
  AuthUserContext,
  withAuthorization,
  withEmailVerification,
} from '../Session';
import { withFirebase } from '../Firebase';
import { PasswordForgetForm } from '../PasswordForget';
import PasswordChangeForm from '../PasswordChange';

//Material Components
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
// import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

const SIGN_IN_METHODS = [
  {
    id: 'password',
    provider: null,
  },
  {
    id: 'google.com',
    provider: 'googleProvider',
  },
];

const AccountPage = () => {
  const classes = useStyles();

  return (
    <AuthUserContext.Consumer>
      {(authUser) => (
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <div className={classes.paper}>
            <Avatar className={classes.avatar}>
              <AccountCircleIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Account: {authUser.email}
            </Typography>
            <PasswordForgetForm />
            <PasswordChangeForm />
            <br></br>
            <LoginManagement authUser={authUser} />
          </div>
        </Container>
      )}
    </AuthUserContext.Consumer>
  );
};

class LoginManagementBase extends Component {
  constructor(props) {
    super(props);

    this.state = {
      activeSignInMethods: [],
      error: null,
    };
  }

  componentDidMount() {
    this.fetchSignInMethods();
  }

  fetchSignInMethods = () => {
    this.props.firebase.auth
      .fetchSignInMethodsForEmail(this.props.authUser.email)
      .then((activeSignInMethods) =>
        this.setState({ activeSignInMethods, error: null }),
      )
      .catch((error) => this.setState({ error }));
  };

  onSocialLoginLink = (provider) => {
    this.props.firebase.auth.currentUser
      .linkWithPopup(this.props.firebase[provider])
      .then(this.fetchSignInMethods)
      .catch((error) => this.setState({ error }));
  };

  onDefaultLoginLink = (password) => {
    const credential = this.props.firebase.emailAuthProvider.credential(
      this.props.authUser.email,
      password,
    );

    this.props.firebase.auth.currentUser
      .linkAndRetrieveDataWithCredential(credential)
      .then(this.fetchSignInMethods)
      .catch((error) => this.setState({ error }));
  };

  onUnlink = (providerId) => {
    this.props.firebase.auth.currentUser
      .unlink(providerId)
      .then(this.fetchSignInMethods)
      .catch((error) => this.setState({ error }));
  };

  render() {
    const { activeSignInMethods, error } = this.state;

    const useStyles = makeStyles((theme) => ({
      paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
      avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
      },
      form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(3),
      },
      submit: {
        margin: theme.spacing(3, 0, 2),
      },
    }));

    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={useStyles.paper}>
          <Typography component="h1" variant="h5">
            Sign In Methods:<br></br>
          </Typography>
          {SIGN_IN_METHODS.map((signInMethod) => {
            const onlyOneLeft = activeSignInMethods.length === 1;
            const isEnabled = activeSignInMethods.includes(
              signInMethod.id,
            );

            return (
              <>
                <div key={signInMethod.id}>
                  {signInMethod.id === 'password' ? (
                    <DefaultLoginToggle
                      onlyOneLeft={onlyOneLeft}
                      isEnabled={isEnabled}
                      signInMethod={signInMethod}
                      onLink={this.onDefaultLoginLink}
                      onUnlink={this.onUnlink}
                    />
                  ) : (
                    <SocialLoginToggle
                      onlyOneLeft={onlyOneLeft}
                      isEnabled={isEnabled}
                      signInMethod={signInMethod}
                      onLink={this.onSocialLoginLink}
                      onUnlink={this.onUnlink}
                    />
                  )}
                </div>
                <br></br>
              </>
            );
          })}
          {error && error.message}
        </div>
      </Container>
    );
  }
}

const SocialLoginToggle = ({
  onlyOneLeft,
  isEnabled,
  signInMethod,
  onLink,
  onUnlink,
}) =>
  isEnabled ? (
    <Button
      type="button"
      onClick={() => onUnlink(signInMethod.id)}
      disabled={onlyOneLeft}
      type="submit"
      fullWidth
      variant="contained"
      color="primary"
    >
      Deactivate {signInMethod.id}
    </Button>
  ) : (
    <Button
      type="button"
      onClick={() => onLink(signInMethod.provider)}
      type="submit"
      fullWidth
      variant="contained"
      color="primary"
    >
      Link {signInMethod.id}
    </Button>
  );

class DefaultLoginToggle extends Component {
  constructor(props) {
    super(props);

    this.state = { passwordOne: '', passwordTwo: '' };
  }

  onSubmit = (event) => {
    event.preventDefault();

    this.props.onLink(this.state.passwordOne);
    this.setState({ passwordOne: '', passwordTwo: '' });
  };

  onChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  render() {
    const {
      onlyOneLeft,
      isEnabled,
      signInMethod,
      onUnlink,
    } = this.props;

    const { passwordOne, passwordTwo } = this.state;

    const isInvalid =
      passwordOne !== passwordTwo || passwordOne === '';

    const useStyles = makeStyles((theme) => ({
      form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(3),
      },
      submit: {
        margin: theme.spacing(3, 0, 2),
      },
    }));

    return isEnabled ? (
      <Button
        type="button"
        onClick={() => onUnlink(signInMethod.id)}
        disabled={onlyOneLeft}
        fullWidth
        variant="contained"
        color="primary"
        className={useStyles.submit}
      >
        Deactivate {signInMethod.id}
      </Button>
    ) : (
      <form
        onSubmit={this.onSubmit}
        className={useStyles.form}
        noValidate
      >
        <TextField
          autoComplete="passwordOne"
          name="passwordOne"
          value={passwordOne}
          onChange={this.onChange}
          variant="standard"
          fullWidth
          id="passwordOne"
          label="New Password"
          autoFocus
          type="password"
        />
        <TextField
          autoComplete="passwordTwo"
          name="passwordTwo"
          value={passwordTwo}
          onChange={this.onChange}
          variant="standard"
          required
          fullWidth
          id="passwordTwo"
          label="Confirm New Password"
          autoFocus
          type="password"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          className={useStyles.submit}
          disabled={isInvalid}
        >
          Link {signInMethod.id}
        </Button>
      </form>
    );
  }
}

const LoginManagement = withFirebase(LoginManagementBase);

const condition = (authUser) => !!authUser;

export default compose(
  withEmailVerification,
  withAuthorization(condition),
)(AccountPage);
