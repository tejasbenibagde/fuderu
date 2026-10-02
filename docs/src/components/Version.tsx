import React from "react";
import { CURRENT_VERSION } from "../constants";

export default function Version(): React.JSX.Element {
  return <span>{CURRENT_VERSION}</span>;
}

export { CURRENT_VERSION };
