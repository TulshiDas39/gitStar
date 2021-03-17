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
  branchDetails:BranchDetails[];
  uniqueBrancNames:string[];
}

export type IReduxState = ReturnType<IStore['getState']>

export interface BranchDetails{
  name:string;
  commits:ICommit[];
}