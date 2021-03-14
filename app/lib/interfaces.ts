import { DefaultLogFields } from "simple-git";

export interface ICommit extends DefaultLogFields{
  branchName:string;
  avrebHash:string;
}

export interface IRepository{
  path:string;
  name:string;
}