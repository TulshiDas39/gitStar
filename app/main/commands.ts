export const Commands={
    GetBranchesOfCommit:(commitId:string)=>`git branch -a --contains ${commitId}`,

}