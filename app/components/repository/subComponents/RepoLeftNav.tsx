import React from "react";

export type TRepoLeftTab = "commit"|"branches"|"history"|"remotes";

interface IState{
    
}

const initialState:IState={
}

interface IProps{
    onTabChange:(tab:TRepoLeftTab)=>void;
    selectedTab: TRepoLeftTab;
}

function RepoLeftNavComponent(props:IProps){

    return (
        <div className="col-3 repoLeftPanel">
            <div className={`${props.selectedTab==='commit'?'active':''}`} onClick={()=>props.onTabChange("commit")}>
                Commit
            </div>
            <div className={`${props.selectedTab==='branches'?'active':''}`} onClick={()=>props.onTabChange("branches")}>Branch Explorer</div>
            <div className={`${props.selectedTab==='history'?'active':''}`} onClick={()=>props.onTabChange("history")}>Commit History</div>
            <div className={`${props.selectedTab==='remotes'?'active':''}`} onClick={()=>props.onTabChange("remotes")}>Remotes</div>
        </div>
    )
}

export const RepoLeftNav = React.memo(RepoLeftNavComponent);