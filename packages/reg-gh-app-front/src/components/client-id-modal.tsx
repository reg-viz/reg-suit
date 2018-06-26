import * as React from "react";
import { Modal, Input } from "semantic-ui-react";
import { consoleBox, input } from "./client-id-modal.css";

export interface ClientIdModalProps {
  repositoryName: string;
  clientId: string;
  trigger: any;
}

export class ClientIdModal extends React.Component<ClientIdModalProps> {

  inputRef: HTMLInputElement | null = null;

  constructor(props: ClientIdModalProps) {
    super(props);
    this.handleRef = this.handleRef.bind(this);
    this.handleOnClick = this.handleOnClick.bind(this);
  }

  handleRef(input: any) {
    if (!input) {
      this.inputRef = null;
      return;
    }
    this.inputRef = input.inputRef;
  }

  handleOnClick() {
    if (!this.inputRef) return;
    this.inputRef.focus();
    this.inputRef.selectionStart = 0;
    this.inputRef.selectionEnd = this.props.clientId.length;
    document.execCommand("copy");
    this.inputRef.blur();
  }

  render() {
    const { repositoryName, clientId, trigger } = this.props;
    const conf = JSON.stringify({
      "plugins": {
        "reg-notify-github-plugin": {
          "clientId": clientId
        }
      }
    }, null, 2);
    return (
      <Modal className="client-id-modal" trigger={trigger}>
        <Modal.Header>Client ID for "{repositoryName}"</Modal.Header>
        <Modal.Content>
          <Input
            className={input}
            ref={this.handleRef}
            fluid={true}
            value={clientId}
            action={{ color: "teal", labelPosition: "right", icon: "copy", content: "Copy to clipboard", onClick: this.handleOnClick }}
          />
          Then open regconfig.json in your editor and append the following:
          <pre className={consoleBox}>{conf}</pre>
          Learn more? Read <a
            className="text-link"
            target="_blank"
            href="https://github.com/reg-viz/reg-suit/tree/master/packages/reg-notify-github-plugin"
          >reg-notify-github-plugin doc</a>.
        </Modal.Content>
      </Modal>
    );
  }
}

