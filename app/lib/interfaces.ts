import { DefaultLogFields } from "simple-git";

export interface ICommit extends DefaultLogFields{
  branchName:string;
  avrebHash:string;
}