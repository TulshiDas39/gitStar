import React from 'react';
import { useSelectorTyped } from '../../store';
import { RepoLeftNav, RepoRightPanel, TRepoLeftTab } from './subComponents';
import { useMultiState } from '../common/hooks';

interface IState{
    selectedTab:TRepoLeftTab
}

const initialState:IState={
    selectedTab:"commit",
}

function RepositoryComponent(){
    const store = useSelectorTyped(state=>({
        selectedRepository:state.repository
    }))

    const [state,setState]= useMultiState(initialState);

    if(!store.selectedRepository) return <p>No Repository Selected</p>;
    return (
        <div className="row no-gutters h-100">
            <RepoLeftNav onTabChange={(tab)=>setState({selectedTab:tab})} selectedTab={state.selectedTab} />
            <RepoRightPanel selectedTab={state.selectedTab}/>
        </div>
    )
}

export const Repository = React.memo(RepositoryComponent);