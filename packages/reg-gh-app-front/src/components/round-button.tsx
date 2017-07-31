import * as React from "react";
import { root } from "./round-button.css";

export interface RoundButtonProps {
  onClick?: () => void;
  children?: any;
}

export function RoundButton(props: RoundButtonProps) {
  return (
    <button
      className={root}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
