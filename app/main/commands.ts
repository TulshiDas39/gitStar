import { LogFields } from "../constants/constants"

export const Commands={
    GetBranchesOfCommit:(commitId:string)=>`git branch -a --contains ${commitId}`,
    GetCommitsOfBranche:(branchName:string)=>`git log ${branchName} --first-parent`,
}
export const LogFormat= `--pretty=${LogFields.Hash}:%H%n${LogFields.Abbrev_Hash}:%h%n${LogFields.Parent_Hashes}:%p%n${LogFields.Author_Name}:%an%n${LogFields.Author_Email}:%ae%n${LogFields.Date}:%ad%n${LogFields.Ref}:%D%n${LogFields.Message}:%s%n`