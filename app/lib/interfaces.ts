import { BranchSummary, DefaultLogFields, LogResult } from "simple-git";
import { IStore } from "../store";

export interface ICommit extends DefaultLogFields{
  avrebHash:string;
}

export interface IRepository{
  path:string;
  name:string;
}

export interface IRepositoryInfo{
  branchSummery:BranchSummary;
  commits:LogResult<ICommit>;
}

export type IReduxState = ReturnType<IStore['getState']>
