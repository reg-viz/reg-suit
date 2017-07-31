import * as React from "react";
import { Icon } from "semantic-ui-react";
import { actionCreator } from "../action-creator";
import { root, logoutLink } from "./logout.css";

export interface LogoutProps { }

export class Logout extends React.Component<LogoutProps> {

  constructor(props: LogoutProps) {
    super(props);
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  handleOnClick() {
    actionCreator.logout();
  }

  render() {
    return (
      <div className={root}>
        <p className={logoutLink} onClick={this.handleOnClick}>
          <span>Logout...</span>
          <Icon name="sign out" />
        </p>
      </div>
    );
  }
}

