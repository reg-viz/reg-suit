import * as React from "react";
import { Input } from "semantic-ui-react";
import { actionCreator } from "../action-creator";
import { help } from "./search-form.css";

export interface SearchFormProps {
  searchText: string;
  style?: {[key: string]: any};
}

export class SearchForm extends React.Component<SearchFormProps>{
  constructor(props: SearchFormProps) {
    super(props);
    this.handleOnChange = this.handleOnChange.bind(this);
  }

  handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    actionCreator.changeSearchText(e.target.value);
  }

  render() {
    return (
      <div style={this.props.style}>
        <Input
          icon="search"
          iconPosition="left"
          placeholder="Search on repository or owner"
          onChange={this.handleOnChange}
          fluid={true}
          value={this.props.searchText}
        />
        <p className={help}>
          Can't find your repository?&nbsp;
          <a
            className="text-link"
            target="_blank"
            href="https://github.com/apps/reg-suit/installations/new"
          >Configure your Installation.</a>
        </p>
      </div>
    );
  }
}
