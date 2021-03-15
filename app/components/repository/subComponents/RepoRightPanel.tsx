import React from "react";
import { TRepoLeftTab } from ".";

interface IProps{
    selectedTab:TRepoLeftTab;
}

function RepoRightPanelComponent(props:IProps){
    return (
        <div className="col-9">
            right panel
        </div>
    )
}

export const RepoRightPanel = React.memo(RepoRightPanelComponent);