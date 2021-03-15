import { DefaultLogFields } from "simple-git";
import { IStore } from "../store";

export interface ICommit extends DefaultLogFields{
  branchName:string;
  avrebHash:string;
}

export interface IRepository{
  path:string;
  name:string;
}

export type IReduxState = ReturnType<IStore['getState']>
