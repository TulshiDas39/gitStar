export const Commands={
    GetBranchesOfCommit:(commitId:string)=>`git branch -a --contains ${commitId}`,
    GetCommitsOfBranche:(branchName:string)=>`git log ${branchName} --first-parent`,
}