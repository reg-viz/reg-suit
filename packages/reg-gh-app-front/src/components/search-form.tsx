import * as React from "react";
import { actionCreator } from "../action-creator";

export interface SearchFormProps {
  searchText: string;
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
      <div>
        <input type="text" onChange={this.handleOnChange} value={this.props.searchText} />
      </div>
    );
  }
}
