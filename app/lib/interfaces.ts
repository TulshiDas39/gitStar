import { BranchSummary, DefaultLogFields, LogResult } from "simple-git";
import { IStore } from "../store";

export interface ICommit extends DefaultLogFields{
  avrebHash:string;
  branchesFromThis?:BranchDetails[];
  mergeInfo?:string[];
}

export interface IRepository{
  path:string;
  name:string;
}

export interface IRepositoryInfo{
  branchSummery:BranchSummary;
  commits:LogResult<ICommit>;
  allCommits:ICommit[];
  branchDetails:BranchDetails[];
  branchTree:BranchDetails[];
  uniqueBrancNames:string[];
  lastReferencesByBranch: ILastReference[];
  remotes:string[];
}

export interface ILastCommitByRemote{
  remote:string;
  commit:string;
}

export interface ILastReference{
  branchName:string;
  dateTime:string;
}

export type IReduxState = ReturnType<IStore['getState']>

export interface BranchDetails{
  name:string;
  commits:ICommit[];
  lastCommitsByRemotes:ILastCommitByRemote[];
  noDerivedCommits:boolean;
}