import * as React from "react";
import { Repository } from "../types";
import { tokenize } from "../util/tokenize";

export interface RepositoryItemProps {
  installationId: number;
  repository: Repository;
}

export class RepositoryItem extends React.Component<RepositoryItemProps> {

  private _inputRef: HTMLInputElement;

  constructor(props: RepositoryItemProps) {
    super(props);
    this.addRef = this.addRef.bind(this);
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  addRef(input: HTMLInputElement | null) {
    if (input) {
      this._inputRef = input;
    }
  }

  handleOnClick() {
    this._inputRef.focus();
    this._inputRef.selectionStart = 0;
    this._inputRef.selectionEnd = this._inputRef.value.length;
    document.execCommand("copy");
    this._inputRef.blur();
  }

  render() {
    const { name, owner, id } = this.props.repository;
    const clientId = tokenize({
      repositoryId: id,
      installationId: this.props.installationId,
      ownerName: owner.login,
      repositoryName: name,
    });
    return (
      <div>
        {name}
        <p>
        <input type="text" readOnly={true} value={clientId} ref={this.addRef} />
        <button onClick={this.handleOnClick}>copy to clipboard</button>
        </p>
      </div>
    );
  }
}
